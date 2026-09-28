/*
Game.ts
*/

import {Application, Container} from 'pixi.js';
import {Player} from "./Player";
import {Lobby} from "./Lobby";
import {Arena, ARENA_SIZE} from "./Arena";
import {Input} from "./Input";
import {Network} from '../network/Network';
import type {PlayerState} from './PlayerState';

export class Game
{
    private app: Application;
    private world: Container;
    private lobby: Lobby;
    private arena: Arena | null = null;
    private localPlayer: Player;
    private remotePlayers = new Map<number, Player>();
    private input: Input;
    private network: Network;
    private playing = false;
    private inMatch = false;

    constructor(app: Application)
    {
        this.app = app;

        this.world = new Container();
        this.lobby = new Lobby();

        this.localPlayer = new Player(4);
        this.localPlayer.x = 500;
        this.localPlayer.y = 500;

        this.input = new Input;

        this.network = new Network({
            onInit: id => {
                console.log('Network initialized:', id);
            },

            onPlayerUpdate: state => {
                this.updateRemotePlayer(state);
            },

            onPlayerDisconnected: id => {
                this.removeRemotePlayer(id);
            },

            onMatchFound: (
                roomId,
                spawnX,
                spawnY
            ) => {
                this.enterMatch(
                    roomId,
                    spawnX,
                    spawnY
                );
            },
        });

        this.world.addChild(this.lobby);
        this.world.addChild(this.localPlayer);

        this.app.ticker.add(() => {
            this.update();
        });
    }

    start(): void
    {
        this.network.join();
        this.playing = true;

        this.app.stage.addChild(this.world);
    }

    private update(): void
    {
        if (!this.playing)
        {
            return;
        }

        this.localPlayer.move(this.input);

        const globalMouse = this.app.renderer.events.pointer.global;
        const worldMouseX = globalMouse.x - this.world.x;
        const worldMouseY = globalMouse.y - this.world.y;

        this.localPlayer.lookAt(
            worldMouseX,
            worldMouseY
        );

        this.updateCamera();

        this.network.sendPosition(
            this.localPlayer.x,
            this.localPlayer.y,
            this.localPlayer.rotation
        );
    }

    private updateCamera(): void
    {
        const mapSize = this.inMatch ? ARENA_SIZE: 2000;

        const halfWidth = this.app.screen.width / 2;
        const halfHeight = this.app.screen.height / 2;

        let cameraX = halfWidth - this.localPlayer.x;
        let cameraY = halfHeight - this.localPlayer.y;

        cameraX = Math.min(0,Math.max(this.app.screen.width - mapSize, cameraX));

        cameraY = Math.min(0, Math.max(this.app.screen.height - mapSize, cameraY));

        this.world.x = cameraX;
        this.world.y = cameraY;
    }

    private updateRemotePlayer(state: PlayerState): void
    {
        let player = this.remotePlayers.get(state.id);

        if (!player)
        {
            player = new Player(4);

            this.remotePlayers.set(state.id, player);
            this.world.addChild(player);
        }

        player.applyState(state);
    }

    private removeRemotePlayer(id: number): void
    {
        const player = this.remotePlayers.get(id);

        if (!player)
        {
            return;
        }

        player.removeFromParent();

        player.destroy();

        this.remotePlayers.delete(id);
    }

    private clearRemotePlayers(): void
    {
        for (const player of this.remotePlayers.values())
        {
            player.removeFromParent();
            player.destroy();
        }

        this.remotePlayers.clear();
    }

    private enterMatch(roomId: number, spawnX: number, spawnY: number): void
    {
        console.log(`Entering room ${roomId}`);

        this.inMatch = true;

        this.clearRemotePlayers();

        this.lobby.removeFromParent();

        if (this.arena)
        {
            this.arena.removeFromParent();
            this.arena.destroy();
        }

        this.arena = new Arena();

        this.world.addChildAt(
            this.arena,
            0
        );

        this.localPlayer.x = spawnX;
        this.localPlayer.y = spawnY;
        this.localPlayer.rotation = 0;

        this.updateCamera();

        console.log(`Spawned at ${spawnX}, ${spawnY}`);
    }
}
