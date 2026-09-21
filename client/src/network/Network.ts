/*
Network.ts
*/

import {Player} from '../game/Player';
import type {PlayerState} from "../game/PlayerState";
import {PacketType, createJoinPacket, createPositionPacket} from './Protocol';


export interface NetworkCallbacks
{
    onInit?: (
        id: number
    ) => void;

    onPlayerUpdate?: (
        state: PlayerState
    ) => void;

    onPlayerDisconnected?: (
        id: number
    ) => void;

    onPadState?: (
        playersOnPad: number
    ) => void;

    onMatchFound?: (
        roomId: number
    ) => void;

}


export class Network
{
    private socket: WebSocket;
    public id: number | null = null;
    private callbacks: NetworkCallbacks;

    constructor(callbacks: NetworkCallbacks = {})
    {
        this.callbacks = callbacks;

        this.socket = new WebSocket('ws://localhost:8080');

        this.socket.binaryType = 'arraybuffer';

        this.socket.addEventListener('open', () => {
            console.log('Connected to server');
        });

        this.socket.addEventListener('message', (event) => {
            this.handleMessage(event.data as ArrayBuffer);
        });
    }

    private handleMessage(buffer: ArrayBuffer): void
    {
        const view = new DataView(buffer);

        const packetType = view.getUint8(0);

        switch (packetType)
        {
            case PacketType.Init:
                {
                    const id = view.getUint32(1);
                    this.id = id;
                    console.log("My player ID:", id);
                    this.callbacks.onInit?.(id);   
                }
                break;


            case PacketType.PlayerUpdate:
                {
                    const state: PlayerState = 
                    {
                        id: view.getUint32(1),
                        x: view.getFloat32(5),
                        y: view.getFloat32(9),
                        rotation: view.getFloat32(13)
                    }

                    if (state.id === this.id)
                    {
                        return;
                    }

                    this.callbacks.onPlayerUpdate?.(state);
                    break;
                }

                case PacketType.PlayerDisconnected:
                    {
                        const id = view.getUint32(1);
                        this.callbacks.onPlayerDisconnected?.(id);
                    }
                    break;

                case PacketType.PadState:
                {
                    const count = view.getUint8(1);

                    this.callbacks.onPadState?.(count);

                    break;
                }

                case PacketType.MatchFound:
                {
                    const roomId = view.getUint32(1);

                    this.callbacks.onMatchFound?.(roomId);

                    break;
                }
        }
    }

    join(): void
    {
        if (this.socket.readyState !== WebSocket.OPEN)
        {
            return;
        }
        
        this.socket.send(createJoinPacket());
    }

    sendPosition(x: number, y: number, rotation: number): void
    {
        if (this.socket.readyState !== WebSocket.OPEN)
        {
            return;
        }

        this.socket.send(createPositionPacket(x, y, rotation));
    }
}