import * as PIXI from "pixi.js"
import * as Collisions from "./collisionmanager"
import { AsyncLoader } from "./utils"

export class GameScene
{
    private stage: PIXI.Container = new PIXI.Container;
    private cameraPos: Collisions.Vector2D = {x: 0, y: 0};
    private playerObject: PIXI.DisplayObject = (new PIXI.Graphics)
                        .beginFill(0xff00ff)
                        .drawCircle(0, 0, 20)
                        .endFill();
    private playerCollision: Collisions.CircleForm = new Collisions.CircleForm;
    private playerVelocity: Collisions.Vector2D = {x: 0, y: 0};
    private keymappings: Map<string, (a: KeyboardEvent, b: string)=>void> = new Map;
    private collisionManager: Collisions.CollisionManager = new Collisions.CollisionManager(0, 0, 5000, 5000);
    private appScreen: PIXI.Rectangle;

    private upState: boolean = false;
    private downState: boolean = false;
    private leftState: boolean = false;
    private rightState: boolean = false;

    public setScene(app: PIXI.Application)
    {
        this.appScreen = app.screen;
        this.updateCamera();
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

        if (levelData.objects) {
            for (let anObject of levelData.objects)
            {
                if (typeof anObject.type !== "string")
                    throw new Error("level object doesnt have a type field")
                if (anObject.type === "rect")
                {
                    // Create a collision form
                    if (!(anObject.x1 && anObject.x2 && anObject.y1 && anObject.y2))
                        throw new Error("rectangle spec is not complete");
                    const rectVertices: Collisions.Vector2D[] = [
                        {x: anObject.x1, y: anObject.y1},
                        {x: anObject.x2, y: anObject.y1},
                        {x: anObject.x2, y: anObject.y2},
                        {x: anObject.x1, y: anObject.y2}
                    ];
                    this.collisionManager.addStaticPolygon(rectVertices);

                    // Create a display object
                    if (!anObject.color)
                        anObject.color = "0x0000ff";
                    let displayObject = new PIXI.Graphics;
                    displayObject.beginFill(Number.parseInt(anObject.color))
                        .drawRect(anObject.x1, anObject.y1, anObject.x2 - anObject.x1, anObject.y2 - anObject.y1)
                        .endFill();
                    this.stage.addChild(displayObject);
                }
                console.log(`Object ${anObject.type} loaded successfully`);
            }
        }

        if (!levelData.xpos)
            levelData.xpos = 450;
        if (!levelData.ypos)
            levelData.ypos = 450;
        if (!levelData.playerRadius)
            levelData.playerRadius = 20;

        this.playerCollision.radius = levelData.playerRadius;

        this.playerObject.position.set(levelData.xpos, levelData.ypos);
        this.cameraPos.x = levelData.xpos;
        this.cameraPos.y = levelData.ypos;
        this.playerCollision.center = {x: this.cameraPos.x, y: this.cameraPos.y};

        this.stage.addChild(this.playerObject);

        PIXI.ticker.shared.add((deltaNumber: number) => {
            //console.log(`${PIXI.ticker.shared.elapsedMS} ms tick, ${1000 / PIXI.ticker.shared.elapsedMS} FPS`);
            this.handleInput(deltaNumber);
            this.handleMovement(deltaNumber);
            this.updateCamera();
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
        this.playerVelocity.x = 0;
        this.playerVelocity.y = 0;
        if (this.leftState)
            this.playerVelocity.x -= 1;
        if (this.rightState)
            this.playerVelocity.x += 1;
        if (this.downState)
            this.playerVelocity.y += 1;
        if (this.upState)
            this.playerVelocity.y -= 1;
        const size = this.playerVelocity.x*this.playerVelocity.x + this.playerVelocity.y*this.playerVelocity.y;
        if (size > 0)
        {
            const scaleFactor = MAXVELOCITY / Math.sqrt(size);
            this.playerVelocity.x *= scaleFactor;
            this.playerVelocity.y *= scaleFactor;
        }
    }
    private handleMovement(deltaTime: number)
    {
        const newPosition: Collisions.Vector2D = {x: this.cameraPos.x + this.playerVelocity.x, y: this.cameraPos.y + this.playerVelocity.y};
        let newPlayerCollision = this.playerCollision.copy() as Collisions.CircleForm;
        newPlayerCollision.center = newPosition;
        let collArray : Collisions.CollisionForm[] = this.collisionManager.collisionsWith(newPlayerCollision);
        if (collArray.length > 0)
        {
            console.log(`${collArray.length} collisions detected`);
            // dont move
        }
        else
        {
            this.playerCollision = newPlayerCollision;
            this.cameraPos = newPosition;
            this.playerObject.position.set(newPosition.x, newPosition.y);
        }
    }
    private updateCamera()
    {
        this.stage.position.set(0.5*this.appScreen.width-this.cameraPos.x, 0.5*this.appScreen.height-this.cameraPos.y);
    }
}