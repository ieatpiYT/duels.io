/*
server.ts
*/

import {WebSocketServer} from 'ws';
import crypto from 'crypto';

const wss = new WebSocketServer({port: 8080});

console.log('WebSocket server running on port 8080');

wss.on('connection', (socket) => {
    const id = crypto.randomUUID();

    console.log(`Client connected: ${id}`)

    let initPacket = 
    {
        type: 'init',
        id: id
    }

    socket.send(JSON.stringify(initPacket));

    socket.on('close', () => {
        console.log(`Client disconnected: ${id}`)
    })
})