/*
server.ts
*/

import {WebSocketServer, WebSocket} from 'ws';

type Player = 
{
    id: number;
    x: number;
    y: number;
    socket: WebSocket;
};

const wss = new WebSocketServer({port: 8080});

console.log('WebSocket server running on port 8080');

const players = new Map<number, Player>();
let nextId = 1;

wss.on('connection', (socket) => {
    const id = nextId++;

    const player: Player = 
    {
        id, 
        x: 0,
        y: 0,
        socket
    }

    players.set(id, player);

    console.log(`Client connected: ${id}`);

    const initBuffer = new ArrayBuffer(5);
    const initView = new DataView(initBuffer);

    initView.setUint8(0, 0); // Init
    initView.setUint32(1, id) // Player ID
    
    socket.send(initBuffer);

    socket.on('message', (data) => {
        const buffer = data as Buffer;
        
        const view = new DataView(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength
        );

        const packetType = view.getUint8(0);

        if (packetType === 1)
        {
            player.x = view.getFloat32(1);
            player.y = view.getFloat32(5);
        }
    });
    
    socket.on('close', () => {
        players.delete(id);

        console.log(`Client disconnected: ${id}`);
    });
});

// Send all player positions 20 times per second
setInterval(() => {
    for (const player of players.values())
    {
        // packet:
        // 1 byte  = packet type
        // 4 bytes = player ID
        // 4 bytes = x
        // 4 bytes = y
        // total = 13 bytes per player

        const buffer = new ArrayBuffer(13);
        const view = new DataView(buffer);

        view.setUint8(0, 2); 
        view.setUint32(1, player.id); 
        view.setFloat32(5, player.x); 
        view.setFloat32(9, player.y); 

        for (const otherPlayer of players.values())
        {
            if (otherPlayer.socket.readyState === WebSocket.OPEN)
            {
                otherPlayer.socket.send(buffer);
            }
        }
    }
}, 16);