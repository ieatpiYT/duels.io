/*
server.ts
*/

import {WebSocketServer, WebSocket} from 'ws';
import crypto from 'crypto';

type Player = 
{
    id: string;
    x: number;
    y: number;
};

const wss = new WebSocketServer({port: 8080});

console.log('WebSocket server running on port 8080');

const players: Record<string, Player> = {};

wss.on('connection', (socket) => {
    const id = crypto.randomUUID();

    console.log(`Client connected: ${id}`);

    players[id] = 
    {
        id: id,
        x: 500,
        y: 300
    }

    let initPacket = 
    {
        type: 'init',
        id: id
    }

    sendPacket(socket, initPacket);
    
    broadcastPlayers();

    socket.on('close', () => {
        delete players[id];

        console.log(`Client disconnected: ${id}`);
        
        broadcastPlayers();
    })
})

function sendPacket(socket: WebSocket, packet: object)
{
    socket.send(JSON.stringify(packet));
}

function broadcastPlayers()
{
    let packet = 
    {
        type: 'players',
        players: players
    }

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
        {
            client.send(JSON.stringify(packet));
        }
    }) 
}
