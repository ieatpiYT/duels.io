/*
Player.ts
*/

import {Graphics} from "pixi.js";

export class Player extends Graphics
{
    speed = 5;

    constructor()
    {
        super();

        this.circle(0, 0, 20);
        this.fill({color: 'red'});
    }

    move(input: {keys: Record<string, boolean>})
    {
        if (input.keys["KeyW"]) 
        {
            this.y -= this.speed;
        }

        if (input.keys["KeyS"]) 
        {
            this.y += this.speed;
        }

        if (input.keys["KeyA"]) 
        {
            this.x -= this.speed;
        }

        if (input.keys["KeyD"]) 
        {
            this.x += this.speed;
        }
    }
}

