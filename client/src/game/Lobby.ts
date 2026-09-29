/*
Lobby.ts
*/

import {
    Container,
    Graphics,
    Text
} from "pixi.js";

export const INTERMISSION_PAD =
{
    x: 300,
    y: 0,
    width: 400,
    height: 200
};

export class Lobby extends Container
{
    private countdownText: Text;

    constructor()
    {
        super();
        
        const background =
            new Graphics()
                .rect(
                    0,
                    0,
                    2000,
                    2000
                )
                .fill({
                    color: "green"
                })
                .stroke({
                    width: 16,
                    color: 0xcc0000,
                    alignment: 1
                });

        this.addChild(background);

        const spawnArea =
            new Graphics()
                .rect(
                    400,
                    400,
                    200,
                    200
                )
                .fill({
                    color: "yellow"
                });

        this.addChild(spawnArea);

        // Intermission pad.
        const intermissionPad =
            new Graphics()
                .rect(
                    INTERMISSION_PAD.x,
                    INTERMISSION_PAD.y,
                    INTERMISSION_PAD.width,
                    INTERMISSION_PAD.height
                )
                .fill({
                    color: "white"
                })
                .stroke({
                    width: 5,
                    color: "black"
                });

        this.addChild(intermissionPad);

        this.countdownText =
            new Text({
                text: "",
                style: {
                    fontSize: 72,
                    fill: "black",
                    fontWeight: "bold",
                    align: "center"
                }
            });

        this.countdownText.anchor.set(0.5);

        this.countdownText.x =
            INTERMISSION_PAD.x +
            INTERMISSION_PAD.width / 2;

        this.countdownText.y =
            INTERMISSION_PAD.y +
            INTERMISSION_PAD.height / 2;

        this.addChild(this.countdownText);
    }

    isOnIntermissionPad(x: number, y: number, radius = 22): boolean
    {
        return (
            x + radius >= INTERMISSION_PAD.x &&
            x - radius <= INTERMISSION_PAD.x + INTERMISSION_PAD.width &&
            y + radius >= INTERMISSION_PAD.y &&
            y - radius <= INTERMISSION_PAD.y + INTERMISSION_PAD.height
        );
    }

    setPadCount(count: number): void
    {
        if (count < 2)
        {
            this.countdownText.text = "";

            return;
        }

        this.countdownText.text = "3";
    }

    setCountdown(seconds: number): void
    {
        if (seconds <= 0)
        {
            this.countdownText.text = "";

            return;
        }

        this.countdownText.text = String(seconds);
    }

    clearCountdown(): void
    {
        this.countdownText.text = "";
    }
}
