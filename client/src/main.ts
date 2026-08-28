/*
main.ts
*/

import {Application, Graphics} from 'pixi.js';

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

    const player = new Graphics()
    .circle(0, 0, 20)
    .fill({color: 'red'})

    player.x = app.screen.width / 2;
    player.y = app.screen.height / 2;

    playButton.addEventListener('click', () => {
        menuOverlay.classList.add('hidden');

        app.stage.addChild(player);
    })
}

initGame().catch((err) => console.error("PixiJS Init Failed:", err));