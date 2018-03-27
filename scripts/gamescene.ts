import * as PIXI from "pixi.js"
import * as Collisions from "./collisionmanager"
import { AsyncLoader } from "./utils"
import { GameLevel } from "./gamelevel";

/**
 * Class that represents and shows a game scene
 * 
 * @export
 * @class GameScene
 */
export class GameScene
{
    private stage: PIXI.Container = new PIXI.Container;
    private keymappings: Map<string, (a: KeyboardEvent, b: string)=>void> = new Map;
    private appScreen: PIXI.Rectangle;
    private level: GameLevel = new GameLevel;

    private upState: boolean = false;
    private downState: boolean = false;
    private leftState: boolean = false;
    private rightState: boolean = false;

    public setScene(app: PIXI.Application)
    {
        this.appScreen = app.screen;
        app.stage = this.stage;

        this.keymappings.set("w", (event, type) => {
            this.upState = type === "down" ? true : false;
        });
        this.keymappings.set("s", (event, type) => {
            this.downState = type === "down" ? true : false;
        });
        this.keymappings.set("a", (event, type) => {
            this.leftState = type === "down" ? true : false;
        });
        this.keymappings.set("d", (event, type) => {
            this.rightState = type === "down" ? true : false;
        })
    }

    public async setup()
    {
        const levelLoader = new AsyncLoader;
        levelLoader.add("leveldata", "./level.data.json");

        let resources = await levelLoader.asyncLoad();
        const levelData = resources["leveldata"].data;

        let levelBorder = new PIXI.Graphics;
        levelBorder.beginFill(0xaeaeae).drawRect(0, 0, 5000, 5000).endFill();
        this.stage.addChild(levelBorder);

        if (!levelData.xpos)
            levelData.xpos = 450;
        if (!levelData.ypos)
            levelData.ypos = 450;
        if (!levelData.playerRadius)
            levelData.playerRadius = 20;

        this.level.loadJsonData(levelData, this.stage);
        this.level.playerObj.onPositionChange.push((newPos: Collisions.Vector2D) => {
            this.stage.position.set(0.5*this.appScreen.width-newPos.x, 0.5*this.appScreen.height-newPos.y);
        })

        PIXI.ticker.shared.add((deltaNumber: number) => {
            //console.log(`${PIXI.ticker.shared.elapsedMS} ms tick, ${1000 / PIXI.ticker.shared.elapsedMS} FPS`);
            this.handleInput(deltaNumber);
        });
    }

    public onKeyDown(event: KeyboardEvent)
    {
        if (this.keymappings.has(event.key)) 
            this.keymappings.get(event.key).call(this, event, "down");
    }
    public onKeyUp(event: KeyboardEvent)
    {
        if (this.keymappings.has(event.key)) 
            this.keymappings.get(event.key).call(this, event, "up");
    }

    private handleInput(deltaTime: number)
    {
        const MAXVELOCITY = 250.0/60.0;
        let playerVelocity: Collisions.Vector2D = {x: 0, y: 0};
        if (this.leftState)
            playerVelocity.x -= 1;
        if (this.rightState)
            playerVelocity.x += 1;
        if (this.downState)
            playerVelocity.y += 1;
        if (this.upState)
            playerVelocity.y -= 1;
        const size = playerVelocity.x*playerVelocity.x + playerVelocity.y*playerVelocity.y;
        if (size > 0)
        {
            const scaleFactor = MAXVELOCITY / Math.sqrt(size);
            playerVelocity.x *= scaleFactor;
            playerVelocity.y *= scaleFactor;
            const collisionManager = this.level.collisionManager;
            this.level.playerObj.collisionCheckMove(playerVelocity, (f:Collisions.CollisionForm): boolean => {
                let collArray: Collisions.CollisionForm[] = collisionManager.collisionsWith(f);
                return collArray.length === 0;
            })
        }
    }
}