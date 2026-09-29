import {
    createWebRTCOfferPacket,
    createWebRTCAnswerPacket,
    createWebRTCIceCandidatePacket
} from './Protocol';

export interface WebRTCCallbacks
{
    onOpen?: () => void;

    onMessage?: (
        data: ArrayBuffer
    ) => void;

    onClose?: () => void;

    onError?: (
        error: Event
    ) => void;
}

export class WebRTCConnection
{
    private peer: RTCPeerConnection;

    private channel: RTCDataChannel | null = null;

    private callbacks: WebRTCCallbacks;

    private sendSignaling: (
        packet: ArrayBuffer
    ) => void;

    constructor(
        isOfferer: boolean,
        sendSignaling: (
            packet: ArrayBuffer
        ) => void,
        callbacks: WebRTCCallbacks = {}
    )
    {
        this.callbacks = callbacks;

        this.sendSignaling = sendSignaling;

        this.peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302'
                }
            ]
        });

        this.peer.addEventListener(
            'icecandidate',
            event => {
                if (!event.candidate)
                {
                    return;
                }

                this.sendSignaling(
                    createWebRTCIceCandidatePacket(
                        JSON.stringify(
                            event.candidate
                        )
                    )
                );
            }
        );

        this.peer.addEventListener(
            'connectionstatechange',
            () => {
                console.log(
                    'WebRTC connection state:',
                    this.peer.connectionState
                );
            }
        );

        this.peer.addEventListener(
            'iceconnectionstatechange',
            () => {
                console.log(
                    'WebRTC ICE state:',
                    this.peer.iceConnectionState
                );
            }
        );

        if (isOfferer)
        {
            this.createDataChannel();
        }
        else
        {
            this.peer.addEventListener(
                'datachannel',
                event => {
                    this.channel = event.channel;

                    this.setupDataChannel(
                        this.channel
                    );
                }
            );
        }
    }

    private createDataChannel(): void
    {
        this.channel =
            this.peer.createDataChannel(
                'game',
                {
                    ordered: false,
                    maxRetransmits: 0
                }
            );

        this.setupDataChannel(
            this.channel
        );
    }

    private setupDataChannel(
        channel: RTCDataChannel
    ): void
    {
        channel.binaryType = 'arraybuffer';

        channel.addEventListener(
            'open',
            () => {
                console.log(
                    'WebRTC DataChannel opened'
                );

                this.callbacks.onOpen?.();
            }
        );

        channel.addEventListener(
            'message',
            event => {
                if (event.data instanceof ArrayBuffer)
                {
                    this.callbacks.onMessage?.(
                        event.data
                    );

                    return;
                }

                if (event.data instanceof Blob)
                {
                    event.data.arrayBuffer().then(
                        buffer => {
                            this.callbacks.onMessage?.(
                                buffer
                            );
                        }
                    );
                }
            }
        );

        channel.addEventListener(
            'close',
            () => {
                console.log(
                    'WebRTC DataChannel closed'
                );

                this.callbacks.onClose?.();
            }
        );

        channel.addEventListener(
            'error',
            error => {
                this.callbacks.onError?.(
                    error
                );
            }
        );
    }

    async createOffer(): Promise<void>
    {
        const offer =
            await this.peer.createOffer();

        await this.peer.setLocalDescription(
            offer
        );

        this.sendSignaling(
            createWebRTCOfferPacket(
                JSON.stringify(
                    offer
                )
            )
        );
    }

    async handleOffer(
        offerString: string
    ): Promise<void>
    {
        const offer =
            JSON.parse(
                offerString
            ) as RTCSessionDescriptionInit;

        await this.peer.setRemoteDescription(
            offer
        );

        const answer =
            await this.peer.createAnswer();

        await this.peer.setLocalDescription(
            answer
        );

        this.sendSignaling(
            createWebRTCAnswerPacket(
                JSON.stringify(
                    answer
                )
            )
        );
    }

    async handleAnswer(
        answerString: string
    ): Promise<void>
    {
        const answer =
            JSON.parse(
                answerString
            ) as RTCSessionDescriptionInit;

        await this.peer.setRemoteDescription(
            answer
        );
    }

    async handleIceCandidate(
        candidateString: string
    ): Promise<void>
    {
        const candidate =
            JSON.parse(
                candidateString
            ) as RTCIceCandidateInit;

        await this.peer.addIceCandidate(
            candidate
        );
    }

    send(
        data: ArrayBuffer
    ): void
    {
        if (!this.channel)
        {
            return;
        }

        if (this.channel.readyState !== 'open')
        {
            return;
        }

        this.channel.send(data);
    }

    close(): void
    {
        this.channel?.close();

        this.peer.close();

        this.channel = null;
    }
}
