/*
Arena.ts
*/

import {Container, Graphics} from "pixi.js";

export const ARENA_SIZE = 1000;

export class Arena extends Container
{
    constructor()
    {
        super();

        const background = new Graphics()
        .rect(
            0,
            0,
            ARENA_SIZE,
            ARENA_SIZE
        )
        .fill({
            color: 0x151515
        });

        this.addChild(background);

        const grid = new Graphics();

        const gridSize = 50;

        for (let x = 0; x <= ARENA_SIZE; x += gridSize)
        {
            grid.moveTo(x, 0);
            grid.lineTo(x, ARENA_SIZE);
        }

        for (let y = 0; y <= ARENA_SIZE; y += gridSize)
        {
            grid.moveTo(0, y);
            grid.lineTo(ARENA_SIZE, y);
        }

        grid.stroke({width: 1, color: 0x303030});

        this.addChild(grid);

        const majorGrid = new Graphics();

        const majorGridSize = 250;

        for (let x = 0; x <= ARENA_SIZE; x += majorGridSize)
        {
            majorGrid.moveTo(x, 0);
            majorGrid.lineTo(x, ARENA_SIZE);
        }

        for (let y = 0; y <= ARENA_SIZE; y += majorGridSize)
        {
            majorGrid.moveTo(0, y);
            majorGrid.lineTo(ARENA_SIZE, y);
        }

        majorGrid.stroke({width: 2, color: 0x404040});

        this.addChild(majorGrid);

        const border = new Graphics()
        .rect(
            0,
            0,
            ARENA_SIZE,
            ARENA_SIZE
        )
        .stroke({
            width: 8,
            color: 0x555555
        });

        this.addChild(border);
    }
}
