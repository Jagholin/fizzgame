import * as PIXI from "pixi.js";
import { GameLevel } from "./gamelevel";
import { GameObject } from "./gameobject";
import { GameScene } from "./gamescene";

window.onload = (ev: Event) => {
    console.log("loaded");

    const app :PIXI.Application = new PIXI.Application({
        view: document.getElementById("mainCanvas") as HTMLCanvasElement,
        width: window.screen.width,
        height: window.screen.height
    });
    document.body.appendChild(app.view);

    let myScene: GameScene = new GameScene;
    myScene.setup().then(() => {
        myScene.setScene(app);
        document.onkeydown = (event) => {
            myScene.onKeyDown(event);
        }
        document.onkeyup = event => {
            myScene.onKeyUp(event);
        }
    });
};
