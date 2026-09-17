/*
Network.ts
*/

import {Graphics} from 'pixi.js';

export class Network
{
    private socket: WebSocket;
    public id: number | null = null;
    public players = new Map<number, Graphics>();

    constructor()
    {
        this.socket = new WebSocket('ws://localhost:8080');

        this.socket.binaryType = 'arraybuffer';

        this.socket.addEventListener('open', () => {
            console.log('Connected to server');
        });

        this.socket.addEventListener('message', (event) => {
            const buffer = event.data as ArrayBuffer;
            const view = new DataView(buffer);

            const packetType = view.getUint8(0);

            // Init packet
            if (packetType === 0)
            {
                this.id = view.getUint32(1);

                console.log('My player ID:', this.id);
            }

            // Player update
            if (packetType === 2)
            {
                const playerId = view.getUint32(1);
                const x = view.getFloat32(5);
                const y = view.getFloat32(9);

                if (playerId === this.id)
                {
                    return;
                }

                let player = this.players.get(playerId);

                if (!player)
                {
                    player = new Graphics();

                    player.circle(0, 0, 20);
                    player.fill({color: 'red'});

                    this.players.set(playerId, player);
                }

                player.x = x;
                player.y = y;
                
            }

            if (packetType === 4)
            {
                const disconnectedID = view.getUint32(1);
                const player = this.players.get(disconnectedID);

                if (player)
                {
                    player.removeFromParent();
                    player.destroy();
                    this.players.delete(disconnectedID);
                    console.log(`Player ${disconnectedID} left the game.`);
                }
            }
        });
    }

    renderFists()
    {
        
    }

    join(): void
    {
        if (this.socket.readyState !== WebSocket.OPEN)
        {
            return;
        }

        // 1 byte packet
        // 3 = join
        const buffer = new ArrayBuffer(1);
        const view = new DataView(buffer);

        view.setUint8(0, 3);

        this.socket.send(buffer);
    }

    sendPosition(x: number, y: number)
    {
        if (this.socket.readyState !== WebSocket.OPEN)
        {
            return;
        }

        // packet type === 1
        // 4 bytes x
        // 4 bytes y
        // total = 9 bytes
        const buffer = new ArrayBuffer(9);
        const view = new DataView(buffer);

        view.setUint8(0, 1);
        view.setFloat32(1, x);
        view.setFloat32(5, y);

        this.socket.send(buffer);
    }
}