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
    private currentScene: UIScene;

    constructor() 
    {
        this.app = new  PIXI.Application({
            view: document.getElementById("mainCanvas") as HTMLCanvasElement,
            width: window.screen.width,
            height: window.screen.height
        });
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
            this.currentScene = this.editorScene;
            document.onkeydown = (event) => {
                if (event.key === "p")
                {
                    this.currentScene.unsetScene();
                    // key reserved for scene switch
                    if (this.currentScene === this.editorScene)
                    {
                        // Switch to game mode
                        this.currentScene = this.gameScene;
                    } else if (this.currentScene === this.gameScene)
                    {
                        // switch to editor mode
                        this.currentScene = this.editorScene;
                    }
                    this.currentScene.setScene(this.app);
                }
                else
                {
                    this.currentScene.onKeyDown(event);
                }
            }
            document.onkeyup = event => {
                this.currentScene.onKeyUp(event);
            }
            document.oncontextmenu = event => {
                this.currentScene.onContextMenu(event)
                return false;
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
