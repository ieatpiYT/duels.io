import {createWebRTCOfferPacket, createWebRTCAnswerPacket, createWebRTCIceCandidatePacket} from './Protocol';

export interface WebRTCCallbacks
{
    onOpen?: () => void;
    onMessage?: ( data: ArrayBuffer ) => void;
    onClose?: () => void;
    onError?: ( error: Event ) => void;
}

export class WebRTCConnection
{
    private peer: RTCPeerConnection;
    private channel: RTCDataChannel | null = null;
    private callbacks: WebRTCCallbacks;
    private sendSignaling: ( packet: ArrayBuffer ) => void;
    private iceQueue: RTCIceCandidateInit[] = [];

    constructor(
        isOfferer: boolean,
        sendSignaling: ( packet: ArrayBuffer ) => void,
        callbacks: WebRTCCallbacks = {}
    )
    {
        this.callbacks = callbacks;
        this.sendSignaling = sendSignaling;
        this.peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:://google.com' }
            ]
        });

        this.peer.addEventListener( 'icecandidate', event =>
        {
            if (!event.candidate)
            {
                return;
            }
            this.sendSignaling( createWebRTCIceCandidatePacket( JSON.stringify( event.candidate ) ) );
        } );

        this.peer.addEventListener( 'connectionstatechange', () =>
        {
            console.log( 'WebRTC connection state:', this.peer.connectionState );
            if (this.peer.connectionState === 'failed')
            {
                this.callbacks.onError?.( new Event( 'failed' ) );
            }
        } );

        this.peer.addEventListener( 'iceconnectionstatechange', () =>
        {
            console.log( 'WebRTC ICE state:', this.peer.iceConnectionState );
        } );

        if (isOfferer)
        {
            this.createDataChannel();
        }
        else
        {
            this.peer.addEventListener( 'datachannel', event =>
            {
                this.channel = event.channel;
                this.setupDataChannel( this.channel );
            } );
        }
    }

    private createDataChannel(): void
    {
        this.channel = this.peer.createDataChannel( 'game', { ordered: false, maxRetransmits: 0 } );
        this.setupDataChannel( this.channel );
    }

    private setupDataChannel( channel: RTCDataChannel ): void
    {
        channel.binaryType = 'arraybuffer';
        channel.addEventListener( 'open', () =>
        {
            console.log( 'WebRTC DataChannel opened' );
            this.callbacks.onOpen?.();
        } );

        channel.addEventListener( 'message', event =>
        {
            if (event.data instanceof ArrayBuffer)
            {
                this.callbacks.onMessage?.( event.data );
                return;
            }
            if (event.data instanceof Blob)
            {
                event.data.arrayBuffer().then( buffer =>
                {
                    this.callbacks.onMessage?.( buffer );
                } ).catch( error => console.error( 'Failed to convert Blob to ArrayBuffer:', error ) );
            }
        } );

        channel.addEventListener( 'close', () =>
        {
            console.log( 'WebRTC DataChannel closed' );
            this.callbacks.onClose?.();
        } );

        channel.addEventListener( 'error', error =>
        {
            this.callbacks.onError?.( error );
        } );
    }

    async createOffer(): Promise<void>
    {
        try
        {
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription( offer );
            this.sendSignaling( createWebRTCOfferPacket( JSON.stringify( offer ) ) );
        }
        catch ( error )
        {
            console.error( 'Failed to create offer:', error );
            throw error;
        }
    }

    async handleOffer( offerString: string ): Promise<void>
    {
        try
        {
            const offer = JSON.parse( offerString ) as RTCSessionDescriptionInit;
            await this.peer.setRemoteDescription( offer );
            const answer = await this.peer.createAnswer();
            await this.peer.setLocalDescription( answer );
            this.sendSignaling( createWebRTCAnswerPacket( JSON.stringify( answer ) ) );
            await this.processIceQueue();
        }
        catch ( error )
        {
            console.error( 'Failed to handle offer:', error );
            throw error;
        }
    }

    async handleAnswer( answerString: string ): Promise<void>
    {
        try
        {
            const answer = JSON.parse( answerString ) as RTCSessionDescriptionInit;
            await this.peer.setRemoteDescription( answer );
            await this.processIceQueue();
        }
        catch ( error )
        {
            console.error( 'Failed to handle answer:', error );
            throw error;
        }
    }

    async handleIceCandidate( candidateString: string ): Promise<void>
    {
        try
        {
            const candidate = JSON.parse( candidateString ) as RTCIceCandidateInit;
            if (!this.peer.remoteDescription)
            {
                this.iceQueue.push( candidate );
                return;
            }
            await this.peer.addIceCandidate( candidate );
        }
        catch ( error )
        {
            console.error( 'Failed to add ICE candidate:', error );
        }
    }

    private async processIceQueue(): Promise<void>
    {
        while (this.iceQueue.length > 0)
        {
            const candidate = this.iceQueue.shift();
            if (candidate)
            {
                try
                {
                    await this.peer.addIceCandidate( candidate );
                }
                catch ( error )
                {
                    console.error( 'Failed to clear queued ICE candidate:', error );
                }
            }
        }
    }

    send( data: ArrayBuffer ): void
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
        this.iceQueue = [];
    }
}
