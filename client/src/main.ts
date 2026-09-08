/*
main.ts
*/

import {Application} from 'pixi.js';
import {Player} from './game/Player';
import {Input} from './game/Input';
import {Network} from './network/Network';

let canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const playButton = document.getElementById('playButton') as HTMLButtonElement;
const menuOverlay = document.getElementById('menuOverlay') as HTMLDivElement;

const app = new Application();

async function initGame() 
{
    // Initialize PixiJS game canvas
    await app.init({
        canvas: canvas,
        resizeTo: window,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        backgroundColor: 0x1a1a1a
    })
    
    const player = new Player();
    const input = new Input();

    // TODO: Only register player with the server after pressing Play button
    const network = new Network();

    player.x = app.screen.width / 2;
    player.y = app.screen.height / 2;
    
    app.ticker.add(() => {
        player.move(input);

        network.sendPosition(player.x, player.y);

        for (const otherPlayer of network.players.values())
        {
            if (!otherPlayer.parent)
            {
                app.stage.addChild(otherPlayer);
            }
        }
    })

    playButton.addEventListener('click', () => {
        menuOverlay.classList.add('hidden');

        app.stage.addChild(player);
    })
}

initGame().catch((err) => console.error("PixiJS Init Failed:", err));