/*
server.ts
*/

import {WebSocketServer, WebSocket} from 'ws';

enum PacketType
{
    Init = 0,
    Position = 1,
    PlayerUpdate = 2,
    Join = 3,
    PlayerDisconnected = 4,
    PadState = 5,
    MatchFound = 6
}

type Player = 
{
    id: number;
    x: number;
    y: number;
    rotation: number;
    socket: WebSocket;
    roomId: number;
    onIntermissionPad: boolean;
};

type Room = 
{
    id: number;
    players: Set<number>;
    map: string;
}

const wss = new WebSocketServer({port: 8080});

console.log('WebSocket server running on port 8080');

const players = new Map<number, Player>();
const rooms = new Map<number, Room>();

let nextPlayerId = 1;
let nextRoomId = 1;

const LOBBY_ROOM_ID = 0;

rooms.set(LOBBY_ROOM_ID,
{
    id: LOBBY_ROOM_ID,
    players: new Set<number>(),
    map: "lobby"
});

const INTERMISSION_PAD =
{
    x: 300,
    y: 0,
    width: 400,
    height: 200
};

const MATCH_SIZE = 2;

const PAD_TIME = 3000;

const ARENA_SIZE = 1000;

let padEnteredAt: number | null = null;

function send(socket: WebSocket, buffer: ArrayBuffer): void
{
    if (socket.readyState === WebSocket.OPEN)
    {
        socket.send(buffer);
    }
}

function createInitPacket(id: number): ArrayBuffer 
{
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.Init);
    view.setUint32(1, id);

    return buffer;
}

function createPlayerUpdatePacket(player: Player): ArrayBuffer 
{
    const buffer = new ArrayBuffer(17);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.PlayerUpdate);
    view.setUint32(1, player.id);
    view.setFloat32(5, player.x);
    view.setFloat32(9, player.y);
    view.setFloat32(13, player.rotation);

    return buffer;
}

function createDisconnectPacket(id: number): ArrayBuffer 
{
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.PlayerDisconnected);
    view.setUint32(1, id);

    return buffer;
}

function createPadStatePacket(count: number): ArrayBuffer 
{
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.PadState);
    view.setUint8(1, count);

    return buffer;
}

function createMatchFoundPacket(roomId: number, spawnX: number, spawnY: number): ArrayBuffer 
{
    const buffer = new ArrayBuffer(13);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.MatchFound);

    view.setUint32(1, roomId);

    view.setFloat32(5, spawnX);
    view.setFloat32(9, spawnY);

    return buffer;
}

function isOnIntermissionPad(player: Player): boolean 
{
    const radius = 22;

    return (
        player.x + radius >= INTERMISSION_PAD.x &&
        player.x - radius <= INTERMISSION_PAD.x + INTERMISSION_PAD.width &&
        player.y + radius >= INTERMISSION_PAD.y &&
        player.y - radius <= INTERMISSION_PAD.y + INTERMISSION_PAD.height
    );
}

function createRoom(matchPlayers: Player[]): void 
{
    const roomId = nextRoomId++;

    const room: Room = 
    {
        id: roomId,
        players: new Set<number>(),
        map: "arena"
    };

    rooms.set(roomId, room);

    const lobby = rooms.get(LOBBY_ROOM_ID);

    for (let index = 0; index < matchPlayers.length; index++) 
    {
        const player = matchPlayers[index];

        if (!player)
        {
            continue;
        }

        if (lobby)
        {
            lobby.players.delete(player.id);
        }

        room.players.add(player.id);

        player.roomId = roomId;
        player.onIntermissionPad = false;

        let spawnX = 250;
        let spawnY = 500;

        if (index === 1)
        {
            spawnX = 750;
            spawnY = 500;
        }

        player.x = spawnX;
        player.y = spawnY;
        player.rotation = 0;

        send(
            player.socket,
            createMatchFoundPacket(
                roomId,
                spawnX,
                spawnY
            )
        );
    }

    console.log(`Created room ${roomId} with ${matchPlayers.length} players.`);
}

function checkIntermissionPad(): void 
{
    const waitingPlayers = [...players.values()].filter(
        player =>
            player.roomId === LOBBY_ROOM_ID &&
            player.onIntermissionPad
    );

    if (waitingPlayers.length < MATCH_SIZE) 
    {
        padEnteredAt = null;

        return;
    }

    if (padEnteredAt === null) 
    {
        padEnteredAt = Date.now();

        console.log("Matchmaking countdown started.");

        return;
    }

    const elapsed = Date.now() - padEnteredAt;

    if (elapsed < PAD_TIME) 
    {
        return;
    }

    const matchPlayers = waitingPlayers.slice(0, MATCH_SIZE);

    createRoom(matchPlayers);

    padEnteredAt = null;
}

wss.on('connection', (socket) => {
    const id = nextPlayerId++;

    let player: Player | null = null;

    console.log(`Client connected: ${id}`);

    socket.on('message', (data) => {
        const buffer = data as Buffer;

        const view = new DataView(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength
        );

        const packetType = view.getUint8(0);

        if (packetType === PacketType.Join)
        {
            if (player)
            {
                return;
            }

            player = 
            {
                id, 
                x: 500,
                y: 500,
                rotation: 0,
                socket,
                roomId: LOBBY_ROOM_ID,
                onIntermissionPad: false
            }

            players.set(id, player);

            const lobby = rooms.get(LOBBY_ROOM_ID);

            if (lobby)
            {
                lobby.players.add(id);
            }

            send(socket, createInitPacket(id));

            console.log(`Player joined: ${id}`);

            return;
        }

        if (packetType === PacketType.Position && player)
        {
            player.x = view.getFloat32(1);
            player.y = view.getFloat32(5);
            player.rotation = view.getFloat32(9);

            if (player.roomId === LOBBY_ROOM_ID)
            {
                player.onIntermissionPad = isOnIntermissionPad(player);
            }
        }
    });

    socket.on('close', () => {
        if (!player)
        {
            console.log(`Client disconnected: ${id}`);
            return;
        }

        const oldRoomId = player.roomId;

        players.delete(id);

        const room = rooms.get(oldRoomId);

        if (room)
        {
            room.players.delete(id);
        }

        const packet = createDisconnectPacket(id);

        if (room)
        {
            for (const playerId of room.players)
            {
                const other = players.get(playerId);

                if (!other)
                {
                    continue;
                }

                if (other.socket.readyState === WebSocket.OPEN)
                {
                    send(other.socket, packet);
                }
            }
        }

        if (oldRoomId !== LOBBY_ROOM_ID && room && room.players.size === 0)
        {
            rooms.delete(oldRoomId);
        }

        if (oldRoomId === LOBBY_ROOM_ID)
        {
            padEnteredAt = null;
        }

        player = null;

        console.log(`Player disconnected: ${id}`);
    });
});

setInterval(() => {
    for (const room of rooms.values())
    {
        if (room.players.size === 0)
        {
            continue;
        }

        for (const playerId of room.players)
        {
            const player = players.get(playerId);

            if (!player)
            {
                continue;
            }

            const packet = createPlayerUpdatePacket(player);

            for (const recipientId of room.players)
            {
                if (recipientId === player.id)
                {
                    continue;
                }

                const recipient = players.get(recipientId);

                if (!recipient)
                {
                    continue;
                }

                send(recipient.socket, packet);
            }
        }
    }
}, 50);

setInterval(() => {
    for (const player of players.values())
    {
        if (player.roomId === LOBBY_ROOM_ID)
        {
            player.onIntermissionPad = isOnIntermissionPad(player);
        }
    }

    const waitingPlayers = [...players.values()]
        .filter(
            player =>
                player.roomId === LOBBY_ROOM_ID &&
                player.onIntermissionPad
        );

    if (waitingPlayers.length > 0)
    {
        const packet = createPadStatePacket(waitingPlayers.length);

        for (const player of waitingPlayers)
        {
            send(player.socket, packet);
        }
    }

    checkIntermissionPad();
}, 50);
