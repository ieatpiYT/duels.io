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
                x: 300,
                y: 300,
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

        if (packetType === 1 && player)
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