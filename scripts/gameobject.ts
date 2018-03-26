import { GameLevel } from "./gamelevel";
import * as PIXI from "pixi.js"
import * as Collisions from "./collisionmanager";

export class GameObject
{
    private levelContainer: GameLevel;
    private displayObject: PIXI.DisplayObject;
    private collisionObject: Collisions.CollisionForm;
    private collisionManager: Collisions.CollisionManager;

    public setLevel(level: GameLevel) 
    {
        this.levelContainer = level;
        this.collisionManager = level.collisionManager;
    }

    public initFromJson(aJson: any, graphicsParent: PIXI.Container)
    {
        if (!(aJson.x1 && aJson.x2 && aJson.y1 && aJson.y2))
            throw new Error("rectangle spec is not complete");
        const rectVertices: Collisions.Vector2D[] = [
            {x: aJson.x1, y: aJson.y1},
            {x: aJson.x2, y: aJson.y1},
            {x: aJson.x2, y: aJson.y2},
            {x: aJson.x1, y: aJson.y2}
        ];
        let aPolygon: Collisions.PolygonForm = new Collisions.PolygonForm;
        aPolygon.vertices = rectVertices;
        this.collisionObject = aPolygon;
        this.collisionManager.addStaticForm(this.collisionObject);

        // Create a display object
        if (!aJson.color)
            aJson.color = "0x0000ff";
        let displayObject = new PIXI.Graphics;
        displayObject.beginFill(Number.parseInt(aJson.color))
            .drawRect(aJson.x1, aJson.y1, aJson.x2 - aJson.x1, aJson.y2 - aJson.y1)
            .endFill();
        this.displayObject = displayObject;
        graphicsParent.addChild(displayObject);
    }
}
