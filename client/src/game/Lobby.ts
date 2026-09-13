/*
Lobby.ts
*/

import {Container, Graphics} from 'pixi.js';

export class Lobby extends Container
{
    constructor()
    {
        super();

        const background = new Graphics();
        background.rect(0, 0, 1000, 1000);
        background.fill({color: 'green'});
        this.addChild(background);

        const spawnArea = new Graphics();
        spawnArea.rect(400, 400, 200, 200);
        spawnArea.fill({color: 'yellow'});
        this.addChild(spawnArea);
    }
}


