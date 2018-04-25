import { GameLevel } from "./gamelevel";
import * as PIXI from "pixi.js"
import * as Collisions from "./collisionmanager";
import * as _ from "lodash"
import { observable } from "./utils";
import { Vector2D } from "./polygontools"

export interface PropertyMeta
{
    readonly name: string;
    readonly type: "string"|"int"|"color"|"bool";
    readonly setter: (value: any)=>void;
    readonly getter: ()=>any;
    readonly verifier: (value: any)=>"full"|"partial"|"none";
}

export class EditCursor
{
    public type: "vertex" | "edge" | "nil" = "nil";
    public index: number = 0;
}

export class GameObject
{
    private levelContainer: GameLevel;
    private displayObject: PIXI.DisplayObject = new PIXI.Graphics;
    private collisionObject: Collisions.CollisionForm;
    private objectColor: number = 0xff00ff;
    private _selected: boolean = false;
    private _editorActive: boolean = false;
    private _removed: boolean = false;
    @observable("onIdentifierChanged")
    private identifier: string;
    public onIdentifierChanged: (()=>void) [] = [];
    public editCursor: EditCursor = new EditCursor;

    constructor()
    {
        this.identifier = "aGameObject";
    }

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

    public set editorActive(newActive: boolean)
    {
        if (this._editorActive === newActive)
            return;
        if (this._removed)
            return;
        this._editorActive = newActive;
        this.redrawDisplayObject();
    }

    public get editorActive(): boolean
    {
        return this._editorActive;
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
        const vertDescr: PIXI.Point[] = myCo.vertices.map((aPoint: Vector2D)=>{
            return new PIXI.Point(aPoint.x, aPoint.y);
        });
        gc.drawPolygon(vertDescr).endFill();
        if (this._selected)
        {
            gc.beginFill(this._editorActive ? 0x30ffaf : 0xffffff);
            gc.lineStyle(1, 0x000000);
            // Draw rectangles on all vertices
            for (let aPoint of vertDescr)
            {
                gc.drawRect(aPoint.x - 3, aPoint.y - 3, 7, 7);
            }
            gc.endFill();
            if (this.editCursor.type === "vertex")
            {
                // over-draw vertex at the cursor index
                gc.beginFill(0x202020);
                gc.drawRect(vertDescr[this.editCursor.index].x - 4, vertDescr[this.editCursor.index].y - 4, 9, 9);
                gc.endFill();
            }
            else if (this.editCursor.type === "edge")
            {
                // over-draw the edge at the cursor
                gc.lineStyle(3, 0xA00000);
                gc.moveTo(vertDescr[this.editCursor.index].x, vertDescr[this.editCursor.index].y);
                let nextIndex = this.editCursor.index+1;
                if (nextIndex === vertDescr.length) nextIndex = 0;
                gc.lineTo(vertDescr[nextIndex].x, vertDescr[nextIndex].y);
            }
        }

    }

    public initAsNGonAt(n: number, r: number, x: number, y: number)
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
        newPoly.translation = {
            x: x,
            y: y
        };
        this.collisionObject = newPoly;
        this.redrawDisplayObject();
        collisionManager.addStaticForm(newPoly);
        this.displayObject.position.set(x, y);
        this.collisionObject.onGeometryChanged.push((newVerts) => {
            this.redrawDisplayObject();
        });
    }

    public initFromJson(aJson: any)
    {
        if (this._removed)
            throw new Error("cant init a removed object");
        const collisionManager = this.levelContainer.collisionManager;
        let rectVertices: Vector2D[] = [];
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
        if (typeof aJson.xpos === "undefined") aJson.xpos = 0;
        if (typeof aJson.ypos === "undefined") aJson.ypos = 0;
        aPolygon.translation = {
            x: aJson.xpos,
            y: aJson.ypos
        };
        this.collisionObject = aPolygon;
        collisionManager.addStaticForm(this.collisionObject);
        this.collisionObject.onGeometryChanged.push((newVerts) => {
            this.redrawDisplayObject();
        });

        this.redrawDisplayObject();
        this.displayObject.position.set(aJson.xpos, aJson.ypos);
    }

    public cutLevelAssociation()
    {
        // Basically removes this object from level, collision and display
        this.displayObject.parent.removeChild(this.displayObject);
        this.levelContainer.collisionManager.removeStaticForm(this.collisionObject);
        this._removed = true;
    }

    public move(deltaX: number, deltaY: number)
    {
        const oldTranslation: Vector2D = this.collisionObject.translation;
        this.displayObject.position.set(oldTranslation.x + deltaX, oldTranslation.y + deltaY);
        this.collisionObject.translation = {
            x: oldTranslation.x + deltaX,
            y: oldTranslation.y + deltaY
        };
    }

    public moveVertex(index: number, deltaX: number, deltaY: number)
    {
        let myPoly = this.collisionObject as Collisions.PolygonForm;
        myPoly.moveVertexTo(index, myPoly.vertices[index].x + deltaX, myPoly.vertices[index].y + deltaY);
        this.redrawDisplayObject();
    }

    public propertiesMeta(): PropertyMeta[]
    {
        let result: PropertyMeta[] = [];
        result.push({
            name: "Identifier",
            type: "string",
            setter: (value: any) => {
                if (! _.isString(value))
                    value = value.toString();
                (this.identifier as any) = {
                    data: value,
                    muted: true
                };
            },
            getter: ()=>{
                return this.identifier;
            },
            verifier: (value) => {
                if (_.isString(value))
                    return "none";
                const checkExpr = /^\w+$/;
                if (checkExpr.test(value))
                    return "full";
                return "none";
            }
        });
        return result;
    }

    public editCursorAt(pos: Vector2D)
    {
        this.editCursor.type = "nil";
        // Go over all vertices to see if one of them is close to the point
        const myColl = this.collisionObject as Collisions.PolygonForm;
        let counter = 0;
        for (let aVertex of myColl.vertices)
        {
            let dx = aVertex.x - pos.x + myColl.translation.x;
            let dy = aVertex.y - pos.y + myColl.translation.y;
            let d = Math.sqrt(dx*dx + dy*dy);
            if (d <= 6.0)
            {
                // the vertex is now under cursor
                this.editCursor.type="vertex";
                this.editCursor.index=counter;
                this.redrawDisplayObject();
                return;
            }
            ++counter;
        }

        counter = 0;

        // No vertices are close enough, go over all the edges
        myColl.forEachEdge((anEdge:{v1: Vector2D, v2: Vector2D}): boolean => {
            let d = Collisions.pointToSegment(pos, anEdge.v1, anEdge.v2);
            if (d <= 4.0)
            {
                // the edge is now under cursor
                this.editCursor.type="edge";
                this.editCursor.index=counter;
                return false;
            }
            ++counter;
            return true;
        });
        this.redrawDisplayObject();
    }
}
