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
    roomId: number | null;
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

const INTERMISSION_PAD =
{
    x: 300,
    y: 0,
    width: 400,
    height: 200
};

const MATCH_SIZE = 2;

const PAD_TIME = 3000;

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

function createPlayerUpdatePacket(player: Player): ArrayBuffer {
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

function createMatchFoundPacket(roomId: number): ArrayBuffer 
{
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.MatchFound);
    view.setUint32(1, roomId);

    return buffer;
}

function isOnIntermissionPad(player: Player): boolean 
{
    const radius = 22;

    return (
        player.x + radius >= INTERMISSION_PAD.x &&
        player.x - radius <=
            INTERMISSION_PAD.x + INTERMISSION_PAD.width &&
        player.y + radius >= INTERMISSION_PAD.y &&
        player.y - radius <=
            INTERMISSION_PAD.y + INTERMISSION_PAD.height
    );
}

function createRoom(matchPlayers: Player[]): void 
{
    const roomId = nextRoomId++;

    const room: Room = 
    {
        id: roomId,
        players: new Set(matchPlayers.map(player => player.id)),
        map: "arena"
    };

    rooms.set(roomId, room);

    for (const player of matchPlayers) 
    {
        player.roomId = roomId;
        player.onIntermissionPad = false;

        send(player.socket,createMatchFoundPacket(roomId));
    }

    console.log(`Created room ${roomId} with ${matchPlayers.length} players.`);
}

function checkIntermissionPad(): void 
{
    const waitingPlayers = [...players.values()].filter(
        player =>
            player.roomId === null &&
            player.onIntermissionPad
    );

    if (waitingPlayers.length < MATCH_SIZE) 
    {
        padEnteredAt = null;
        return;
    }

    // Two players on pad
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

    // Three seconds have passed.
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
            // Prevent same connection from joining twice
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
                roomId: null,
                onIntermissionPad: false
            }

            players.set(id, player);
            send(socket, createInitPacket(id));

            console.log( `Player joined: ${id}` );

            return;
        }

        // Position receiver
        if (packetType === PacketType.Position && player)
        {
            player.x = view.getFloat32(1);
            player.y = view.getFloat32(5);
            player.rotation = view.getFloat32(9);

            if (player.roomId === null)
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

        const packet = createDisconnectPacket(id);

        for (const other of players.values())
        {
            if (other.roomId === oldRoomId && other.socket.readyState === WebSocket.OPEN)
            {
                send(other.socket,packet);
            }
        }

        if (oldRoomId !== null)
        {
            const room = rooms.get(oldRoomId);

            if (room)
            {
                room.players.delete(id);

                if (room.players.size === 0)
                {
                    rooms.delete(oldRoomId);
                }
            }
        }

        player = null;
        
        console.log(`Player disconnected: ${id}`);
    });
});

// Network tick
setInterval(() => {
    for (const player of players.values())
    {
        // Players without rooms remain in lobby
        if (player.roomId == null)
        {
            continue;
        }

        const packet = createPlayerUpdatePacket(player);
        const room = rooms.get(player.roomId);

        if (!room)
        {
            continue;
        }
        
        for (const playerId of room.players)
        {
            const recipient = players.get(playerId);

            if (!recipient)
            {
                continue;
            }

            send(recipient.socket, packet);
        }
    }
}, 50);


// Matchmaking tick
setInterval(() => {
    for (const player of players.values())
    {
        if (player.roomId === null)
        {
            player.onIntermissionPad = isOnIntermissionPad(player);
        }
    }

    const waitingPlayers = [...players.values()]
                .filter(player =>
                        player.roomId === null && player.onIntermissionPad
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
