import { GameLevel } from "./gamelevel";
import * as PIXI from "pixi.js"
import * as Collisions from "./collisionmanager";
import * as _ from "lodash"

export class GameObject
{
    private levelContainer: GameLevel;
    private displayObject: PIXI.DisplayObject = new PIXI.Graphics;
    private collisionObject: Collisions.CollisionForm;
    private objectColor: number = 0xff00ff;
    private _selected: boolean = false;
    private _removed: boolean = false;

    public setGraphicsParent(aContainer: PIXI.Container)
    {
        aContainer.addChild(this.displayObject);
    }

    public set selected(newSelected: boolean) 
    {
        if (this._removed)
            return;
        if (newSelected === this._selected)
            return;
        this._selected = newSelected;
        this.redrawDisplayObject();
    }

    public get selected() : boolean
    {
        return this._selected;
    }

    public setLevel(level: GameLevel) 
    {
        if (this._removed)
            throw(new Error("Can't add a removed object"));
        this.levelContainer = level;
    }

    public redrawDisplayObject()
    {
        if (this._removed)
            return;
        const gc = this.displayObject as PIXI.Graphics;
        gc.clear().beginFill(this.objectColor);
        const myCo = this.collisionObject as Collisions.PolygonForm;
        const vertDescr: PIXI.Point[] = myCo.vertices.map((aPoint: Collisions.Vector2D)=>{
            return new PIXI.Point(aPoint.x, aPoint.y);
        });
        gc.drawPolygon(vertDescr).endFill();
        if (this._selected)
        {
            gc.beginFill(0xffffff);
            gc.lineStyle(1, 0x000000);
            // Draw rectangles on all vertices
            for (let aPoint of vertDescr)
            {
                gc.drawRect(aPoint.x - 3, aPoint.y - 3, 7, 7);
            }
            gc.endFill();
        }
    }

    public initAsNGonAt(n: number, r: number, x: number, y: number, graphicsParent: PIXI.Container)
    {
        if (this._removed)
            throw new Error("cant init a removed object");
        const collisionManager = this.levelContainer.collisionManager;
        if (this.collisionObject)
        {
            // remove an old collision object
            collisionManager.removeStaticForm(this.collisionObject);
        }
        let newPoly: Collisions.PolygonForm = new Collisions.PolygonForm(this);
        newPoly.createNGonAroundPoint(n, r, 0, 0);
        this.collisionObject = newPoly;
        this.redrawDisplayObject();
        collisionManager.addStaticForm(newPoly);
        this.collisionObject.onGeometryChanged.push((newVerts) => {
            this.redrawDisplayObject();
        });
        graphicsParent.addChild(this.displayObject);
    }

    public initFromJson(aJson: any)
    {
        if (this._removed)
            throw new Error("cant init a removed object");
        const collisionManager = this.levelContainer.collisionManager;
        let rectVertices: Collisions.Vector2D[] = [];
        if (aJson.type === "rect")
        {
            if (!(aJson.x1 && aJson.x2 && aJson.y1 && aJson.y2))
                throw new Error("rectangle spec is not complete");
            rectVertices = [
                {x: aJson.x1, y: aJson.y1},
                {x: aJson.x2, y: aJson.y1},
                {x: aJson.x2, y: aJson.y2},
                {x: aJson.x1, y: aJson.y2}
            ];
        }
        else 
        {
            console.assert(_.isArray(aJson.vertices));
            for (let aVertDescr of aJson.vertices)
            {
                console.assert(_.isNumber(aVertDescr.x) && _.isNumber(aVertDescr.y));
                rectVertices.push({x: aVertDescr.x, y: aVertDescr.y});
            }
        }
        let aPolygon: Collisions.PolygonForm = new Collisions.PolygonForm(this);
        aPolygon.vertices = rectVertices;
        this.collisionObject = aPolygon;
        collisionManager.addStaticForm(this.collisionObject);
        this.collisionObject.onGeometryChanged.push((newVerts) => {
            this.redrawDisplayObject();
        });

        this.redrawDisplayObject();
    }

    public cutLevelAssociation()
    {
        // Basically removes this object from level, collision and display
        this.displayObject.parent.removeChild(this.displayObject);
        this.levelContainer.collisionManager.removeStaticForm(this.collisionObject);
        this._removed = true;
    }
}
