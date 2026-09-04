import {WebSocketServer} from 'ws';

const wss = new WebSocketServer({port: 8080});

wss.on('connection', (socket) => {
    console.log('Client connected')

    socket.send('Hello from server!');


    socket.on('close', () => {
        console.log('Client disconnected.')
    })
})