export class Network
{
    private socket: WebSocket;

    constructor()
    {
        this.socket = new WebSocket('ws://localhost:8080');

        this.socket.addEventListener('open', () => {
        console.log('Connected to server');
        });

        this.socket.addEventListener('message', (event) => {
        console.log('Message from server:', event.data);
        });

        this.socket.addEventListener('close', () => {
        console.log('Disconnected from server.');
        });

        this.socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        });
    }
}