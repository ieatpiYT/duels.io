import type {PlayerState} from "../game/PlayerState";
import {
    PacketType,
    createJoinPacket,
    createPositionPacket
} from './Protocol';
import {WebRTCConnection} from './WebRTC';

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
        roomId: number,
        spawnX: number,
        spawnY: number
    ) => void;

    onWebRTCOpen?: () => void;

    onWebRTCMessage?: (
        data: ArrayBuffer
    ) => void;
}

export class Network
{
    private socket: WebSocket;

    public id: number | null = null;

    private callbacks: NetworkCallbacks;

    private webRTC: WebRTCConnection | null = null;

    private opponentId: number | null = null;

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

                break;
            }

            case PacketType.PlayerUpdate:
            {
                const state: PlayerState = 
                {
                    id: view.getUint32(1),
                    x: view.getFloat32(5),
                    y: view.getFloat32(9),
                    rotation: view.getFloat32(13)
                };

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

                break;
            }

            case PacketType.PadState:
            {
                const count = view.getUint8(1);

                this.callbacks.onPadState?.(count);

                break;
            }

            case PacketType.MatchFound:
            {
                const roomId = view.getUint32(1);
                const spawnX = view.getFloat32(5);
                const spawnY = view.getFloat32(9);
                const opponentId = view.getUint32(13);

                this.opponentId = opponentId;

                console.log(
                    `Matched with player ${opponentId}`
                );

                this.callbacks.onMatchFound?.(
                    roomId,
                    spawnX,
                    spawnY
                );

                this.startWebRTC();

                break;
            }

            case PacketType.WebRTCOffer:
            {
                const length = view.getUint32(1);

                const decoder = new TextDecoder();

                const offer =
                    decoder.decode(
                        new Uint8Array(
                            buffer,
                            5,
                            length
                        )
                    );

                this.handleWebRTCOffer(
                    offer
                );

                break;
            }

            case PacketType.WebRTCAnswer:
            {
                const length = view.getUint32(1);

                const decoder = new TextDecoder();

                const answer =
                    decoder.decode(
                        new Uint8Array(
                            buffer,
                            5,
                            length
                        )
                    );

                this.handleWebRTCAnswer(
                    answer
                );

                break;
            }

            case PacketType.WebRTCIceCandidate:
            {
                const length = view.getUint32(1);

                const decoder = new TextDecoder();

                const candidate =
                    decoder.decode(
                        new Uint8Array(
                            buffer,
                            5,
                            length
                        )
                    );

                this.handleWebRTCIceCandidate(
                    candidate
                );

                break;
            }
        }
    }

    private startWebRTC(): void
    {
        if (this.id === null)
        {
            return;
        }

        if (this.opponentId === null)
        {
            return;
        }

        const isOfferer =
            this.id < this.opponentId;

        console.log(
            `Starting WebRTC as ${
                isOfferer
                    ? 'offerer'
                    : 'answerer'
            }`
        );

        this.webRTC =
            new WebRTCConnection(
                isOfferer,
                packet => {
                    this.socket.send(packet);
                },
                {
                    onOpen: () => {
                        console.log(
                            'WebRTC connection established!'
                        );

                        this.callbacks.onWebRTCOpen?.();
                    },

                    onMessage: data => {
                        this.callbacks.onWebRTCMessage?.(
                            data
                        );
                    },

                    onClose: () => {
                        console.log(
                            'WebRTC connection closed'
                        );
                    },

                    onError: error => {
                        console.error(
                            'WebRTC error:',
                            error
                        );
                    }
                }
            );

        if (isOfferer)
        {
            this.webRTC.createOffer();
        }
    }

    private async handleWebRTCOffer(
        offer: string
    ): Promise<void>
    {
        if (!this.webRTC)
        {
            return;
        }

        await this.webRTC.handleOffer(
            offer
        );
    }

    private async handleWebRTCAnswer(
        answer: string
    ): Promise<void>
    {
        if (!this.webRTC)
        {
            return;
        }

        await this.webRTC.handleAnswer(
            answer
        );
    }

    private async handleWebRTCIceCandidate(
        candidate: string
    ): Promise<void>
    {
        if (!this.webRTC)
        {
            return;
        }

        await this.webRTC.handleIceCandidate(
            candidate
        );
    }

    join(): void
    {
        if (this.socket.readyState !== WebSocket.OPEN)
        {
            return;
        }

        this.socket.send(
            createJoinPacket()
        );
    }

    sendPosition(
        x: number,
        y: number,
        rotation: number
    ): void
    {
        if (this.socket.readyState !== WebSocket.OPEN)
        {
            return;
        }

        this.socket.send(
            createPositionPacket(
                x,
                y,
                rotation
            )
        );
    }

    sendWebRTCData(
        data: ArrayBuffer
    ): void
    {
        this.webRTC?.send(
            data
        );
    }

    disconnectWebRTC(): void
    {
        this.webRTC?.close();

        this.webRTC = null;
    }
}
