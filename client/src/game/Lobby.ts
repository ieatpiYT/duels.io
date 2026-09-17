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
        background.rect(0, 0, 2000, 2000);
        background.fill({color: 'green'});
        this.addChild(background);

        const spawnArea = new Graphics();
        spawnArea.rect(400, 400, 200, 200);
        spawnArea.fill({color: 'yellow'});
        this.addChild(spawnArea);

        const intermissionPad = new Graphics();
        intermissionPad.rect(300, 0, 400, 200);
        intermissionPad.fill({color: 'white'});
        intermissionPad.stroke({width: 5, color: 'black'});
        this.addChild(intermissionPad);
    }
}


