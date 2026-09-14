/*
Player.ts
*/

import {Container, Graphics} from "pixi.js";
import {Input} from './Input'

export class Player extends Container
{
    speed = 2;

    constructor()
    {
        super();

        let body = new Graphics().circle(0, 0, 22)
        .fill({color: 'brown'})
        .stroke({width: 2, color: 'black'});

        let leftFist = new Graphics().circle(-25, 0, 8)
        .fill('green')
        .stroke({width: 2, color: 'black'});
        leftFist.rotation = - Math.PI / 5;

        let rightFist = new Graphics().circle(-25, 0, 8)
        .fill('green')
        .stroke({width: 2, color: 'black'});
        rightFist.rotation = Math.PI / 5;

        this.addChild(body, leftFist, rightFist);
    }

    move(input: Input): void
    {
        let dx = 0;
        let dy = 0;

        // Users can either use WASD or arrows to move
        if (input.keys["KeyW"] || input.keys["ArrowUp"]) dy -= 1;
        if (input.keys["KeyS"] || input.keys["ArrowDown"]) dy += 1;
        if (input.keys["KeyA"] || input.keys["ArrowLeft"]) dx -= 1;
        if (input.keys["KeyD"] || input.keys["ArrowRight"]) dx += 1;

        // Normalize vector to prevent diagonal speed boost
        if (dx !== 0 && dy !== 0) 
        {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;
    }
}

