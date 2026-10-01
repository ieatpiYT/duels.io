/*
main.ts
*/

import {Application} from "pixi.js";
import {Game} from "./game/Game";

let canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const playButton = document.getElementById('playButton') as HTMLButtonElement;
const menuOverlay = document.getElementById('menuOverlay') as HTMLDivElement;
const playerNameInput = document.getElementById('playerName') as HTMLInputElement;

const app = new Application();

async function initGame(): Promise<void>
{
    await app.init({
        canvas: canvas,
        resizeTo: window,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        backgroundColor: 0x1a1a1a
    })

    const game = new Game(app);
    
    playButton.addEventListener('click', () => {
        const name = playerNameInput.value.trim().slice(0, 16);

        game.start(name || "Player");
        menuOverlay.classList.add('hidden');
    })
}

initGame().catch((err) => console.error("PixiJS Init Failed:", err));
