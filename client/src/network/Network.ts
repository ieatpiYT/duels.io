/*
Network.ts
*/

import {Player} from '../game/Player';

export class Network
{
    private socket: WebSocket;
    public id: number | null = null;
    public players = new Map<number, Player>();

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
                const rotation = view.getFloat32(13)

                if (playerId === this.id)
                {
                    return;
                }

                let remotePlayer = this.players.get(playerId);

                if (!remotePlayer)
                {
                    remotePlayer = new Player(x, y, 4);

                    this.players.set(playerId, remotePlayer);
                }

                remotePlayer.x = x;
                remotePlayer.y = y;
                remotePlayer.rotation = rotation;
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
        if (this.socket.readyState !== WebSocket.OPEN)
        {
            return;
        }
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

    sendPosition(x: number, y: number, rotation: number)
    {
        if (this.socket.readyState !== WebSocket.OPEN)
        {
            return;
        }

        // packet type === 1
        // 4 bytes x
        // 4 bytes y
        // total = 9 bytes
        const buffer = new ArrayBuffer(13);
        const view = new DataView(buffer);

        view.setUint8(0, 1);
        view.setFloat32(1, x);
        view.setFloat32(5, y);
        view.setFloat32(9, rotation)

        this.socket.send(buffer);
    }
}