import * as Collisions from "./collisionmanager"
import * as PIXI from "pixi.js"
import { observable } from "./utils"
import { Vector2D } from "./polygontools";

interface Object
{
    cameraPos: Vector2D;
}

export class PlayerObject
{
    private collision: Collisions.CollisionForm = null;
    private displayObject: PIXI.DisplayObject = null;
    private initialized: boolean = false;
    public onPositionChange : ((aValue: any)=>void)[] = [];

    @observable("onPositionChange")
    private cameraPos: Vector2D;

    public setGraphicsParent(aContainer: PIXI.Container)
    {
        aContainer.addChild(this.displayObject);
    }

    public initFromJson(aJson: any)
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
        this.displayObject.position.set(aJson.xpos, aJson.ypos);

        this.collision = new Collisions.CircleForm(this);
        let realColl = this.collision as Collisions.CircleForm;
        realColl.center = { x: aJson.xpos, y: aJson.ypos };
        realColl.radius = aJson.radius;

        this.cameraPos = {x: aJson.xpos, y: aJson.ypos};
        
        this.initialized = true;
    }

    public collisionCheckMove(dloc: Vector2D, checkFunc: (f: Collisions.CollisionForm)=>boolean)
    {
        const newCollision = this.collision.shallowCopy();
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
}

