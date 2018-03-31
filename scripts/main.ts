import * as PIXI from "pixi.js";
import { GameLevel } from "./gamelevel";
import { GameObject } from "./gameobject";
import { GameScene } from "./gamescene";
import { LevelEditorScene } from "./leveleditorscene"
import { UIScene } from "./uiscene";
import { AsyncLoader } from "./utils"

class Application 
{
    protected editorScene: UIScene;
    protected gameScene: UIScene;
    protected app: PIXI.Application;
    private currentSceneName: string;

    constructor() 
    {
        this.app = new  PIXI.Application({
            view: document.getElementById("mainCanvas") as HTMLCanvasElement,
            width: window.screen.width,
            height: window.screen.height
        });
        document.body.appendChild(this.app.view);
        // Create a game scene as default
        this.editorScene = new LevelEditorScene; 
        this.gameScene = new GameScene;
        // load level from a json file

        let myLevel: GameLevel = new GameLevel;
        // Load level from file
        this.loadLevel(myLevel, "./level.data.json").then(() => {
            this.editorScene.setLevel(myLevel);
            this.gameScene.setLevel(myLevel);
            this.editorScene.setScene(this.app);
            this.currentSceneName = "editor";
            document.onkeydown = (event) => {
                if (event.key === "p")
                {
                    // key reserved for scene switch
                    if (this.currentSceneName === "editor")
                    {
                        // Switch to game mode
                        this.editorScene.unsetScene();
                        this.gameScene.setScene(this.app);
                        this.currentSceneName = "game";
                    } else if (this.currentSceneName === "game")
                    {
                        // switch to editor mode
                        this.gameScene.unsetScene();
                        this.editorScene.setScene(this.app);
                        this.currentSceneName = "editor";
                    }
                }
                else
                {
                    if (this.currentSceneName === "editor")
                        this.editorScene.onKeyDown(event);
                    else if (this.currentSceneName === "game")
                        this.gameScene.onKeyDown(event);
                }
            }
            document.onkeyup = event => {
                if (this.currentSceneName === "editor")
                    this.editorScene.onKeyUp(event);
                else if (this.currentSceneName === "game")
                    this.gameScene.onKeyUp(event);
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
