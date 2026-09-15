/*
main.ts
*/

import {Application, Container} from 'pixi.js';
import {Player} from './game/Player';
import {Input} from './game/Input';
import {Network} from './network/Network';
import {Lobby} from './game/Lobby';

let canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const playButton = document.getElementById('playButton') as HTMLButtonElement;
const menuOverlay = document.getElementById('menuOverlay') as HTMLDivElement;

const app = new Application();

async function initGame() 
{
    await app.init({
        canvas: canvas,
        resizeTo: window,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        backgroundColor: 0x1a1a1a
    })
    
    const world = new Container();
    const lobby = new Lobby();
    const player = new Player();
    const input = new Input();
    const network = new Network();

    world.addChild(lobby);
    world.addChild(player);

    player.x = 500;
    player.y = 500;

    let playing: boolean = false;
    
    app.ticker.add(() => {
        if (!playing)
        {
            return;
        }
        
        player.move(input);

        const globalMouse = app.renderer.events.pointer.global;
        const worldMouseX = globalMouse.x - world.x;
        const worldMouseY = globalMouse.y - world.y;

        player.lookAt(worldMouseX, worldMouseY);

        world.x = app.screen.width / 2 - player.x;
        world.y = app.screen.height / 2 - player.y;

        network.sendPosition(player.x, player.y);

        for (const otherPlayer of network.players.values())
        {
            if (otherPlayer && !otherPlayer.parent)
            {
                world.addChild(otherPlayer);
            }
        }
    })

    playButton.addEventListener('click', () => {
        network.join();

        playing = true;

        menuOverlay.classList.add('hidden');

        app.stage.addChild(world);
    })
}

initGame().catch((err) => console.error("PixiJS Init Failed:", err));