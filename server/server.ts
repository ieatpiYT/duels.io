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

let nextPlayerIs = 1;
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


wss.on('connection', (socket) => {
    const id = nextPlayerIs++;

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

        if (packetType === 3)
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
                socket
            }

            players.set(id, player);

            const initBuffer = new ArrayBuffer(5);
            const initView = new DataView(initBuffer);

            initView.setUint8(0, 0); // Init
            initView.setUint32(1, id) // Player ID
            
            socket.send(initBuffer);

            console.log(`Player joined: ${id}`);
        }

        // Position receiver
        if (packetType === 1 && player)
        {
            player.x = view.getFloat32(1);
            player.y = view.getFloat32(5);
            player.rotation = view.getFloat32(9);
        }
    });
    
    socket.on('close', () => {
        if (!player)
        {
            console.log(`Client disconnected: ${id}`);
        }

        players.delete(id);

        const buffer = new ArrayBuffer(5);
        const view = new DataView(buffer);

        view.setUint8(0, 4);
        view.setUint32(1, id);

        for (const otherPlayer of players.values())
        {
            if (otherPlayer.socket.readyState === WebSocket.OPEN)
            {
                otherPlayer.socket.send(buffer);
            }
        }

        socket.removeAllListeners();

        player = null;
        
        console.log(`Player disconnected: ${id}`);
    });
});

setInterval(() => {
    for (const player of players.values())
    {
        // packet:
        // 1 byte  = packet type
        // 4 bytes = player ID
        // 4 bytes = x
        // 4 bytes = y
        // total = 13 bytes per player
        const buffer = new ArrayBuffer(17);
        const view = new DataView(buffer);

        view.setUint8(0, 2); // Packet type
        view.setUint32(1, player.id); // Player ID
        view.setFloat32(5, player.x); // x position
        view.setFloat32(9, player.y); // y position
        view.setFloat32(13, player.rotation);
        
        for (const otherPlayer of players.values())
        {
            if (otherPlayer.socket.readyState === WebSocket.OPEN)
            {
                otherPlayer.socket.send(buffer);
            }
        }
    }
}, 16);