/*
Network.ts
*/

export class Network
{
    private socket: WebSocket;

    public id: string | null = null;

    constructor()
    {
        this.socket = new WebSocket('ws://localhost:8080');

        this.socket.addEventListener('open', () => {
            console.log('Connected to server');
        });

        this.socket.addEventListener('message', (event) => {
            const packet = JSON.parse(event.data);

            if (packet.type === 'init')
            {
                this.id = packet.id;

                console.log('My player ID:', this.id);
            }

            if (packet.type === 'players')
            {
                console.log('Players:', packet.players)
            }
        });

        this.socket.addEventListener('close', () => {
            console.log('Disconnected from server.');
        });

        this.socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }
}