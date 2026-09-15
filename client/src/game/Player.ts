/*
Player.ts
*/

import {Container, Graphics} from "pixi.js";
import {Input} from './Input'

export class Player extends Container
{
    speed = 5;
    leftFist: Graphics;
    rightFist: Graphics;
    body: Graphics;

    constructor()
    {
        super();

        this.body = new Graphics().circle(0, 0, 22)
        .fill({color: 'brown'})
        .stroke({width: 2, color: 'black'});

        this.leftFist = new Graphics().circle(0, 0, 8)
        .fill('green')
        .stroke({width: 2, color: 'black'});
        this.leftFist.x = 20;
        this.leftFist.y = -15;

        this.rightFist = new Graphics().circle(0, 0, 8)
        .fill('green')
        .stroke({width: 2, color: 'black'});
        this.rightFist.x = 20;
        this.rightFist.y = 15; 

        this.addChild(this.body, this.leftFist, this.rightFist);
    }

    lookAt(targetX: number, targetY: number): void
    {
        this.rotation = Math.atan2(targetY - this.y, targetX - this.x);
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