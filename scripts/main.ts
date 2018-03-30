import * as PIXI from "pixi.js";
import { GameLevel } from "./gamelevel";
import { GameObject } from "./gameobject";
import { GameScene } from "./gamescene";
import { LevelEditorScene } from "./leveleditorscene"
import { UIScene } from "./uiscene";
import { AsyncLoader } from "./utils"

class Application 
{
    protected uiScene: UIScene;
    protected app: PIXI.Application;

    constructor() 
    {
        this.app = new  PIXI.Application({
            view: document.getElementById("mainCanvas") as HTMLCanvasElement,
            width: window.screen.width,
            height: window.screen.height
        });
        document.body.appendChild(this.app.view);
        // Create a game scene as default
        this.uiScene = new LevelEditorScene; 
        // load level from a json file

        let myLevel: GameLevel = new GameLevel;
        // Load level from file
        this.loadLevel(myLevel, "./level.data.json").then(() => {
            this.uiScene.setLevel(myLevel);
            this.uiScene.setScene(this.app);
            document.onkeydown = (event) => {
                this.uiScene.onKeyDown(event);
            }
            document.onkeyup = event => {
                this.uiScene.onKeyUp(event);
            }
        });
    }

    public async loadLevel(lvlObject: GameLevel, url: string)
    {
        const levelLoader = new AsyncLoader;
        levelLoader.add("leveldata", "./level.data.json");

        let resources = await levelLoader.asyncLoad();
        const levelData = resources["leveldata"].data;

        lvlObject.loadJsonData(levelData);
    }
}

let myApp: Application;

window.onload = (ev: Event) => {
    myApp = new Application;
    console.log("loaded");
};
