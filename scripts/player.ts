import * as Collisions from "./collisionmanager"
import * as PIXI from "pixi.js"

export class PlayerObject
{
    private collision: Collisions.CollisionForm = null;
    private displayObject: PIXI.DisplayObject = null;
    private initialized: boolean = false;
    private cameraPos: Collisions.Vector2D = null;

    public initFromJson(aJson: any, graphicsParent: PIXI.Container)
    {
        if (this.initialized)
        {
            console.error("Double initialization!")
            return;
        }
        this.displayObject = new PIXI.Graphics;
        (this.displayObject as PIXI.Graphics).beginFill(0xff00ff)
            .drawCircle(0, 0, aJson.radius)
            .endFill();
        graphicsParent.addChild(this.displayObject);
        this.displayObject.position.set(aJson.xpos, aJson.ypos);

        this.collision = new Collisions.CircleForm;
        let realColl = this.collision as Collisions.CircleForm;
        realColl.center = { x: aJson.xpos, y: aJson.ypos };
        realColl.radius = aJson.radius;

        this.cameraPos = {x: aJson.xpos, y: aJson.ypos};
        
        this.initialized = true;
    }

    public collisionCheckMove(dloc: Collisions.Vector2D, checkFunc: (f: Collisions.CollisionForm)=>boolean)
    {
        const newCollision = this.collision.copy();
        (newCollision as Collisions.CircleForm).center = {
            x: this.cameraPos.x + dloc.x, y: this.cameraPos.y + dloc.y
        };
        if (checkFunc(newCollision))
        {
            this.collision = newCollision;
            this.cameraPos.x += dloc.x;
            this.cameraPos.y += dloc.y;
            this.displayObject.position.set(this.cameraPos.x, this.cameraPos.y);
        }
    }

    public followCamera(view: PIXI.DisplayObject, windowRect: PIXI.Rectangle)
    {
        view.position.set(0.5*windowRect.width-this.cameraPos.x, 0.5*windowRect.height-this.cameraPos.y);
    }
}
