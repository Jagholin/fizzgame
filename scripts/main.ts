import * as PIXI from "pixi.js";
import { GameLevel } from "./gamelevel";
import { GameObject } from "./gameobject";
import { GameScene } from "./gamescene";

window.onload = (ev: Event) => {
    console.log("loaded");

    const app :PIXI.Application = new PIXI.Application({
        width: 900,
        height: 900
    });
    document.body.appendChild(app.view);

    let mainLevel: GameLevel = new GameLevel();
    let anObject: GameObject = new GameObject();
    mainLevel.addObject(anObject);

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
