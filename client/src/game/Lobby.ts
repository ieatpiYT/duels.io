/*
Lobby.ts
*/

import {Container, Graphics} from 'pixi.js';

export const INTERMISSION_PAD = 
{
    x: 300,
    y: 0,
    width: 400,
    height: 200
}

export class Lobby extends Container
{
    constructor()
    {
        super();

        const background = new Graphics()
        .rect(0, 0, 2000, 2000)
        .fill({color: "green"})
        .stroke({width: 16, color: 0xcc0000, alignment: 1});

        this.addChild(background);

        const spawnArea = new Graphics()
        .rect(400,400,200,200)
        .fill({color: "yellow"});

        this.addChild(spawnArea);


        // Intermission pad.
        const intermissionPad = new Graphics()
        .rect(
            INTERMISSION_PAD.x,
            INTERMISSION_PAD.y,
            INTERMISSION_PAD.width,
            INTERMISSION_PAD.height)
        .fill({color: "white"})
        .stroke({width: 5, color: "black"});

        this.addChild(intermissionPad);
    }


    isOnIntermissionPad(x: number, y: number, radius = 22): boolean
    {
        return (
            x + radius >=
                INTERMISSION_PAD.x &&

            x - radius <=
                INTERMISSION_PAD.x +
                INTERMISSION_PAD.width &&

            y + radius >=
                INTERMISSION_PAD.y &&

            y - radius <=
                INTERMISSION_PAD.y +
                INTERMISSION_PAD.height
        );
    }
}



