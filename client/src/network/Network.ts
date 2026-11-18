import type { PlayerState } from "../game/PlayerState";
import { PacketType, createJoinPacket, createPositionPacket } from "./Protocol";
import { WebRTCConnection } from "./WebRTC";

export interface NetworkCallbacks {
  onInit?: (id: number) => void;
  onPlayerUpdate?: (state: PlayerState) => void;
  onPlayerDisconnected?: (id: number) => void;
  onPadState?: (playersOnPad: number) => void;
  onMatchFound?: (roomId: number, spawnX: number, spawnY: number) => void;
  onWebRTCOpen?: () => void;
  onWebRTCMessage?: (data: ArrayBuffer) => void;
}

export class Network {
  public id: number | null = null;

  private readonly socket: WebSocket;
  private readonly callbacks: NetworkCallbacks;
  private readonly decoder = new TextDecoder();

  private webRTC: WebRTCConnection | null = null;
  private opponentId: number | null = null;

  constructor(callbacks: NetworkCallbacks = {}, url = "ws://localhost:8080") {
    this.callbacks = callbacks;
    this.socket = new WebSocket(url);
    this.socket.binaryType = "arraybuffer";

    this.socket.addEventListener("open", () => {
      console.log("Connected to server");
    });

    this.socket.addEventListener("message", (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        this.handleMessage(event.data);
      }
    });
  }

  private handleMessage(buffer: ArrayBuffer): void {
    const view = new DataView(buffer);
    const packetType = view.getUint8(0) as PacketType;

    switch (packetType) {
      case PacketType.Init: {
        const id = view.getUint32(1);
        this.id = id;
        console.log("My player ID:", id);
        this.callbacks.onInit?.(id);
        break;
      }

      case PacketType.PlayerUpdate: {
        const id = view.getUint32(1);
        if (id === this.id) return;

        const x = view.getFloat32(5);
        const y = view.getFloat32(9);
        const rotation = view.getFloat32(13);
        const name = this.readString(buffer, view, 17);

        this.callbacks.onPlayerUpdate?.({ id, name, x, y, rotation });
        break;
      }

      case PacketType.PlayerDisconnected: {
        this.callbacks.onPlayerDisconnected?.(view.getUint32(1));
        break;
      }

      case PacketType.PadState: {
        this.callbacks.onPadState?.(view.getUint8(1));
        break;
      }

      case PacketType.MatchFound: {
        const roomId = view.getUint32(1);
        const spawnX = view.getFloat32(5);
        const spawnY = view.getFloat32(9);
        const opponentId = view.getUint32(13);

        this.opponentId = opponentId;
        console.log(`Matched with player ${opponentId}`);
        this.callbacks.onMatchFound?.(roomId, spawnX, spawnY);
        this.startWebRTC();
        break;
      }

      case PacketType.WebRTCOffer: {
        const offer = this.readString(buffer, view, 1);
        void this.webRTC?.handleOffer(offer);
        break;
      }

      case PacketType.WebRTCAnswer: {
        const answer = this.readString(buffer, view, 1);
        void this.webRTC?.handleAnswer(answer);
        break;
      }

      case PacketType.WebRTCIceCandidate: {
        const candidate = this.readString(buffer, view, 1);
        void this.webRTC?.handleIceCandidate(candidate);
        break;
      }
    }
  }

  /**
   * Reads a length-prefixed UTF-8 string from the buffer.
   * Assumes a 4-byte Uint32 length header at `lengthOffset`, followed immediately by string bytes.
   */
  private readString(buffer: ArrayBuffer, view: DataView, lengthOffset: number): string {
    const length = view.getUint32(lengthOffset);
    const bytes = new Uint8Array(buffer, lengthOffset + 4, length);
    return this.decoder.decode(bytes);
  }

  private sendPacket(packet: ArrayBuffer | ArrayBufferView): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(packet);
    }
  }

  private startWebRTC(): void {
    if (this.id === null || this.opponentId === null) {
      return;
    }

    // Ensure any stale connection is cleaned up before starting a new one
    this.disconnectWebRTC();

    const isOfferer = this.id < this.opponentId;
    console.log(`Starting WebRTC as ${isOfferer ? "offerer" : "answerer"}`);

    this.webRTC = new WebRTCConnection(
      isOfferer,
      (packet) => this.sendPacket(packet),
      {
        onOpen: () => {
          console.log("WebRTC connection established!");
          this.callbacks.onWebRTCOpen?.();
        },
        onMessage: (data) => {
          this.callbacks.onWebRTCMessage?.(data);
        },
        onClose: () => {
          console.log("WebRTC connection closed");
        },
        onError: (error) => {
          console.error("WebRTC error:", error);
        },
      }
    );

    if (isOfferer) {
      this.webRTC.createOffer();
    }
  }

  join(name: string): void {
    this.sendPacket(createJoinPacket(name));
  }

  sendPosition(x: number, y: number, rotation: number): void {
    this.sendPacket(createPositionPacket(x, y, rotation));
  }

  sendWebRTCData(data: ArrayBuffer): void {
    this.webRTC?.send(data);
  }

  disconnectWebRTC(): void {
    this.webRTC?.close();
    this.webRTC = null;
  }
}
