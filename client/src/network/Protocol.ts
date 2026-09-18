/*
Protocol.ts
*/

export const PacketType = {
    Init: 0,
    Position: 1,
    PlayerUpdate: 2,
    Join: 3,
    PlayerDisconnected: 4
} as const;

export function joinPacket(): ArrayBuffer
{
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);

    view.setUint8(0 , PacketType.Join);

    return buffer;
}

export function initPacket(id: number): ArrayBuffer
{
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.Init);
    view.setUint32(1, id);

    return buffer;

}

export function positionPacket(x: number, y: number, rotation: number): ArrayBuffer
{
    const buffer = new ArrayBuffer(13);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.Position);
    view.setFloat32(1, x);
    view.setFloat32(5, y);
    view.setFloat32(9, rotation);

    return buffer;
}

export function playerUpdatePacket(id: number, x: number, y: number, rotation: number): ArrayBuffer
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

export function disconnectFunction(id: number): ArrayBuffer
{
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);

    view.setUint8(0, PacketType.PlayerDisconnected);

    view.setUint32(1, id);

    return buffer;

}