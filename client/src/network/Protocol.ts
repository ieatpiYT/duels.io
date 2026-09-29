export const PacketType = 
{
    Init: 0,
    Position: 1,
    PlayerUpdate: 2,
    Join: 3,
    PlayerDisconnected: 4,
    PadState: 5,
    MatchFound: 6,
    WebRTCOffer: 7,
    WebRTCAnswer: 8,
    WebRTCIceCandidate: 9
} as const;

export function createJoinPacket(): ArrayBuffer
{
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);

    view.setUint8(0 , PacketType.Join);

    return buffer;
}

export function createInitPacket(id: number): ArrayBuffer
{
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.Init);
    view.setUint32(1, id);

    return buffer;
}

export function createPositionPacket(x: number, y: number, rotation: number): ArrayBuffer
{
    const buffer = new ArrayBuffer(13);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.Position);
    view.setFloat32(1, x);
    view.setFloat32(5, y);
    view.setFloat32(9, rotation);

    return buffer;
}

export function createPlayerUpdatePacket(id: number, x: number, y: number, rotation: number): ArrayBuffer
{
    const buffer = new ArrayBuffer(17);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.PlayerUpdate);
    view.setUint32(1, id);
    view.setFloat32(5, x);
    view.setFloat32(9, y);
    view.setFloat32(13, rotation);

    return buffer;
}

export function createDisconnectPacket(id: number): ArrayBuffer
{
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.PlayerDisconnected);

    view.setUint32(1, id);

    return buffer;
}

export function createPadStatePacket(count: number): ArrayBuffer 
{
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.PadState);
    view.setUint8(1, count);

    return buffer;
}

export function createMatchFoundPacket(
    roomId: number,
    spawnX: number,
    spawnY: number,
    opponentId: number
): ArrayBuffer 
{
    const buffer = new ArrayBuffer(17);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.MatchFound);

    view.setUint32(1, roomId);

    view.setFloat32(5, spawnX);
    view.setFloat32(9, spawnY);

    view.setUint32(13, opponentId);

    return buffer;
}

function createStringPacket(
    packetType: number,
    value: string
): ArrayBuffer
{
    const encoder = new TextEncoder();
    const data = encoder.encode(value);

    const buffer = new ArrayBuffer(5 + data.byteLength);
    const view = new DataView(buffer);

    view.setUint8(0, packetType);
    view.setUint32(1, data.byteLength);

    new Uint8Array(buffer, 5).set(data);

    return buffer;
}

export function createWebRTCOfferPacket(
    offer: string
): ArrayBuffer
{
    return createStringPacket(
        PacketType.WebRTCOffer,
        offer
    );
}

export function createWebRTCAnswerPacket(
    answer: string
): ArrayBuffer
{
    return createStringPacket(
        PacketType.WebRTCAnswer,
        answer
    );
}

export function createWebRTCIceCandidatePacket(
    candidate: string
): ArrayBuffer
{
    return createStringPacket(
        PacketType.WebRTCIceCandidate,
        candidate
    );
}
