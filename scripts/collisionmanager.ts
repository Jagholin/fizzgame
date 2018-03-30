import { Circle } from "pixi.js";
import * as _ from "lodash"
import { observable } from "./utils";

export interface Vector2D
{
    x: number;
    y: number;
}

function fdot(a: Vector2D, b:Vector2D) : number
{
    return a.x*b.x + a.y*b.y;
}

function fadd(a: Vector2D, b: Vector2D) : Vector2D
{
    return {x: a.x + b.x, y: a.y + b.y};
}

function fmul(a: Vector2D, b: number) : Vector2D
{
    return {x: a.x*b, y: a.y*b};
}

function fsub(a: Vector2D, b: Vector2D) : Vector2D
{
    return fadd(a, fmul(b, -1.0));
}

export function fraysegment(aRay: {start: Vector2D, direction: Vector2D}, aSegment: {v1: Vector2D, v2: Vector2D}, margin?: number): {result: boolean, inttype: string, intpoint?: Vector2D}
{
    //const BIGNUM = 10000.0;
    let realMargin: number = (typeof margin === "undefined") ? 0.01 : margin;
    const segmentDir: Vector2D = {
        x: aSegment.v2.x - aSegment.v1.x,
        y: aSegment.v2.y - aSegment.v1.y
    };
    const segmentNorm: Vector2D = {
        x: -segmentDir.y,
        y: segmentDir.x
    };
    const rayNorm: Vector2D = {
        x: -aRay.direction.y,
        y: aRay.direction.x
    };

    const determinant: number = rayNorm.x*segmentNorm.y - rayNorm.y*segmentNorm.x;
    if (Math.abs(determinant) < realMargin)
    {
        // Practically determinant === 0
        // The ray and segment are either parallel or on the same line
        // 1. Find the distance between the lines
        const dfactor = fdot(aRay.start, segmentNorm) - fdot(aSegment.v1, segmentNorm);
        if (Math.abs(dfactor) > realMargin)
            return {result: false, inttype: "parallel"}; // lines are strictly parallel
        let v1factor:number = 0, v2factor:number = 0;
        if (Math.abs(aRay.direction.x) >= Math.abs(aRay.direction.y))
        {
            v1factor = (aSegment.v1.x - aRay.start.x) / aRay.direction.x;
            v2factor = (aSegment.v2.x - aRay.start.x) / aRay.direction.x;
        }
        else 
        {
            v1factor = (aSegment.v1.y - aRay.start.y) / aRay.direction.y;
            v2factor = (aSegment.v2.y - aRay.start.y) / aRay.direction.y;   
        }
        if (v1factor < 0 && v2factor < 0)
            return {result: false, inttype: "colinear"};
        return {result: true, inttype: "colinear"};
    }

    const dray: number = fdot(aRay.start, rayNorm);
    const dsegm: number = fdot(aSegment.v1, segmentNorm);

    const intersectPoint: Vector2D = {
        x: (segmentNorm.y*dray - rayNorm.y*dsegm) / determinant,
        y: (-segmentNorm.x*dray + rayNorm.x*dsegm) / determinant
    }

    // look if this intersect point is on the right side of the ray
    if (Math.abs(aRay.direction.x) >= Math.abs(aRay.direction.y))
    {
        if ((intersectPoint.x - aRay.start.x)/aRay.direction.x < 0)
            return {result: false, inttype: "wrongorientation", intpoint: intersectPoint}; //wrong orientation, no collision
    }
    else
    {
        if ((intersectPoint.y - aRay.start.y)/aRay.direction.y < 0)
            return {result: false, inttype: "wrongorientation", intpoint: intersectPoint};
    }

    // look if intersection lies within the segment
    if (Math.abs(segmentDir.x) >= Math.abs(segmentDir.y))
    {
        const segFactor = (intersectPoint.x - aSegment.v1.x)/segmentDir.x;
        if (segFactor < -realMargin || segFactor > 1.0+realMargin)
            return {result: false, inttype: "outsidesegment", intpoint: intersectPoint};
    }
    else
    {
        const segFactor = (intersectPoint.y - aSegment.v1.y)/segmentDir.y;
        if (segFactor < -realMargin || segFactor > 1.0+realMargin)
            return {result: false, inttype: "outsidesegment", intpoint: intersectPoint};
    }

    return {result: true, inttype: "normal", intpoint: intersectPoint};
}

function fintersect(a: CollisionForm, b: CollisionForm): boolean
{
    const TOLERANCE: number = 0.05;
    if (a instanceof CircleForm || a instanceof PointForm)
    {
        let margin: number = TOLERANCE;
        if (a instanceof CircleForm)
            margin += a.radius;
        if (b instanceof CircleForm)
            margin += b.radius;
        const dsquared: number = fdot(fsub(a.center, (b as PointForm).center), fsub(a.center, (b as PointForm).center));
        return dsquared < margin*margin;
    }
    //const realA: PolygonForm = a as PolygonForm;

    const checkPoint = function(p: Vector2D, poly: PolygonForm) : boolean
    {
        let countInters = 0;
        poly.forEachEdge((seg: {v1: Vector2D, v2: Vector2D}): boolean => {
            let intResult = fraysegment({start: p, direction: {x: 1.0, y: 0.0}}, seg);
            if (intResult.result) ++countInters;
            return true;
        });
        if (countInters % 2 === 0)
            return false;
        else
            return true;
    }

    if (b instanceof PointForm) 
    {
        return checkPoint(b.center, a as PolygonForm);
    }
    else if (b instanceof CircleForm)
    {
        // Check if center is inside
        if (checkPoint(b.center, a as PolygonForm))
            return true;
        // Distance from center to all edges
        let haveIntersect : boolean = false;
        (a as PolygonForm).forEachEdge((seg: {v1: Vector2D, v2: Vector2D}): boolean => {
            if (fdot(fsub(seg.v2, seg.v1), fsub(b.center, seg.v1)) < -TOLERANCE || fdot(fsub(seg.v1, seg.v2), fsub(b.center, seg.v2)) < -TOLERANCE)
            {
                // seg.v1 or seg.v2 is an obtuse angle
                if (Math.min(fdot(fsub(b.center, seg.v1), fsub(b.center, seg.v1)), fdot(fsub(b.center, seg.v2), fsub(b.center, seg.v2))) < b.radius*b.radius)
                {
                    haveIntersect = true;
                    return false;
                }
                return true;
            }
            let segNormal : Vector2D = {
                x: seg.v1.y - seg.v2.y,
                y: seg.v2.x - seg.v1.x
            };
            const normFactor: number = 1.0 / Math.sqrt(fdot(segNormal, segNormal));
            segNormal.x *= normFactor; segNormal.y *= normFactor;
            const dist1: number = fdot(segNormal, seg.v1);
            const dist2: number = fdot(segNormal, b.center);
            if (Math.abs(dist1 - dist2) < b.radius)
            {
                haveIntersect = true;
                return false;
            }
            return true;
        });
        return haveIntersect;
    }
    else if (b instanceof PolygonForm)
    {
        // Check one point of each polygon against the other - "completely inside" check
        if (checkPoint((a as PolygonForm).vertices[0], b) || checkPoint(b.vertices[0], a as PolygonForm))
            return true;
        // intersection between all edges
        let haveIntersect: boolean = false;
        (a as PolygonForm).forEachEdge((seg1: {v1: Vector2D, v2: Vector2D}): boolean => {
            b.forEachEdge((seg2: {v1: Vector2D, v2: Vector2D}): boolean => {
                const stVec: Vector2D = fsub(seg1.v2, seg1.v1);
                const raySegmentColl = fraysegment({start: seg1.v1, direction: stVec}, seg2);
                if (raySegmentColl.result)
                {
                    const distStandard: number = fdot(stVec, stVec);
                    if (raySegmentColl.inttype === "colinear")
                    {
                        if (fdot(fsub(seg2.v1, seg1.v1), fsub(seg2.v1, seg1.v1)) < distStandard || fdot(fsub(seg2.v2, seg1.v1), fsub(seg2.v2, seg1.v1)) < distStandard)
                        {
                            haveIntersect = true;
                            return false;
                        }
                    }
                    else if (fdot(fsub(raySegmentColl.intpoint, seg1.v1), fsub(raySegmentColl.intpoint, seg1.v1)) < distStandard)
                    {
                        haveIntersect = true;
                        return false;
                    }
                }
                return true;
            });
            if (haveIntersect)
                return false;
            return true;
        });
    }
    return false;
}

class BoundingRect
{
    topleft: Vector2D;
    bottomRight: Vector2D;

    constructor(x1: number, x2: number, y1: number, y2: number)
    {
        this.topleft = {
            x: Math.min(x1, x2),
            y: Math.min(y1, y2)
        };
        this.bottomRight = {
            x: Math.max(x1, x2),
            y: Math.max(y1, y2)
        };
    }
    public contains(po: Vector2D|BoundingRect): boolean 
    {
        if (po instanceof BoundingRect)
        {
            if (po.topleft.x >= this.topleft.x && po.topleft.y >= this.topleft.y && po.bottomRight.x <= this.bottomRight.x && po.bottomRight.y <= this.bottomRight.y)
                return true;
            return false;
        }
        if (po.x >= this.topleft.x && po.y >= this.topleft.y && po.x <= this.bottomRight.x && po.y <= this.bottomRight.y)
            return true;
        return false;
    }
    public intersects(br: BoundingRect): boolean
    {
        const topBound: number = Math.max(br.topleft.y, this.topleft.y);
        const botBound: number = Math.min(br.bottomRight.y, this.bottomRight.y);
        if (topBound > botBound)
            return false;
        const leftBound: number = Math.max(br.topleft.x, this.topleft.x);
        const rightBound: number = Math.min(br.bottomRight.x, this.bottomRight.x);
        if (leftBound > rightBound)
            return false;
        return true;
    }
}

type geometryChangeFunc = ((newVerts:any)=>void) | {f: ((newVerts:any)=>void), data: any};
export interface CollisionForm
{
    readonly boundingRect: BoundingRect;
    readonly owner: any;
    quadNode: QuadNode;
    onGeometryChanged: geometryChangeFunc[];
    intersects(aForm: CollisionForm): boolean;
    copy(): CollisionForm;
}

export class PolygonForm implements CollisionForm
{
    @observable("onGeometryChanged") // Push doesnt trigger the callback LOL
    public vertices: Vector2D[];
    private _bounds: BoundingRect; // TODO: recalculate bounds after changing geometry
    public quadNode: QuadNode;
    public onGeometryChanged: geometryChangeFunc[] = [];
    readonly owner: any;

    constructor (formOwner: any)
    {
        this.owner = formOwner;
        this.vertices = [];
        this.onGeometryChanged.push(() => {
            this._bounds = undefined; // force bounding rect recalculation;
        })
    }

    public emitVerticesChanged(){
        for (let f of this.onGeometryChanged)
        {
            let realF: ((newVerts:any)=>void) = typeof(f) === "function" ? f : f.f;
            realF(this.vertices);
        }
    }

    public moveVertexTo(i: number, x: number, y: number)
    {
        this.vertices[i].x = x;
        this.vertices[i].y = y;
        this.emitVerticesChanged();
    }
    
    public createNewVertexAfter(i: number)
    {
        const nextI = (i+1) % this.vertices.length;
        this.vertices = this.vertices.splice(i, 0, {
            x: 0.5*(this.vertices[i].x + this.vertices[nextI].x),
            y: 0.5*(this.vertices[i].y + this.vertices[nextI].y)
        });
    }

    public createNGonAroundPoint(n: number, r: number, x: number, y: number)
    {
        let verts: Vector2D[] = [];
        const sqAdjust: number = n === 4 ? Math.PI*0.25 : 0;
        for (let i = 0; i < n; ++i)
        {
            verts.push({
                x: Math.sin(2*Math.PI*i / n + sqAdjust) * r + x,
                y: Math.cos(2*Math.PI*i / n + sqAdjust) * r + y
            });
        }
        this.vertices = verts;
    }

    public forEachEdge (func: (a: {v1: Vector2D, v2: Vector2D}) => boolean)
    {
        for (let i = 0; i < this.vertices.length; ++i)
        {
            const nextI = i === this.vertices.length - 1 ? 0 : i+1;
            const segment = {
                v1: {x: this.vertices[i].x, y: this.vertices[i].y},
                v2: {x: this.vertices[nextI].x, y: this.vertices[nextI].y}
            }
            if (! func(segment)) 
                break;
        }
    }
    public intersects(aForm: CollisionForm): boolean
    {
        return fintersect(this, (aForm));
    }
    get boundingRect(): BoundingRect 
    {
        if (this._bounds instanceof BoundingRect)
            return this._bounds;
        let result = {
            xmin: Infinity, xmax: -Infinity, ymin: Infinity, ymax: -Infinity
        };
        for (let v of this.vertices) 
        {
            if (result.xmin > v.x) result.xmin = v.x;
            if (result.xmax < v.x) result.xmax = v.x;
            if (result.ymin > v.y) result.ymin = v.y;
            if (result.ymax < v.y) result.ymax = v.y;
        }
        this._bounds = new BoundingRect(result.xmin, result.xmax, result.ymin, result.ymax);
        return this._bounds;
    }
    public copy(): CollisionForm
    {
        let result = new PolygonForm(this.owner);
        for (let vert in this.vertices)
        {
            result.vertices.push(this.vertices[vert]);
        }
        return result;
    }
}

export class CircleForm implements CollisionForm
{
    public radius: number;
    public center: Vector2D;
    public quadNode: QuadNode;
    public onGeometryChanged: geometryChangeFunc[] = [];
    readonly owner: any;

    constructor (formOwner: any)
    {
        this.owner = formOwner;
    }

    public intersects(aForm: CollisionForm): boolean
    {
        if (aForm instanceof PolygonForm)
            return fintersect(aForm, this);
        return fintersect(this, aForm);
    }
    get boundingRect(): BoundingRect
    {
        return new BoundingRect(this.center.x - this.radius, this.center.x + this.radius, this.center.y - this.radius, this.center.y + this.radius);
    }
    public copy(): CollisionForm
    {
        let result = new CircleForm(this.owner);
        result.radius = this.radius;
        result.center = {x: this.center.x, y: this.center.y};
        return result;
    }
}

export class PointForm implements CollisionForm
{
    public center: Vector2D;
    public quadNode: QuadNode;
    public onGeometryChanged: geometryChangeFunc[] = [];
    readonly owner: any;

    constructor (formOwner: any)
    {
        this.owner = formOwner;
    }

    public intersects(aForm: CollisionForm): boolean
    {
        return fintersect(aForm, this);
    }
    get boundingRect(): BoundingRect
    {
        return new BoundingRect(this.center.x - 1.0, this.center.x + 1.0, this.center.y - 1.0, this.center.y + 1.0);
    }
    public copy(): CollisionForm
    {
        let result = new PointForm(this.owner);
        result.center = {x: this.center.x, y: this.center.y};
        return result;
    }
}

class QuadNode
{
    readonly topLeft: QuadNode | null;
    readonly topRight: QuadNode | null;
    readonly bottomLeft: QuadNode | null;
    readonly bottomRight: QuadNode | null;
    readonly parentNode: QuadNode | null = null;
    readonly boundingRect: BoundingRect;

    forms: Set<CollisionForm> = new Set;

    constructor(br: BoundingRect, depth: number, parent?: QuadNode)
    {
        this.boundingRect = br;
        if (depth === 0)
        {
            this.topLeft = null;
            this.topRight = null;
            this.bottomLeft = null;
            this.bottomRight = null;
        }
        else 
        {
            const halflineX: number = (br.topleft.x + br.bottomRight.x) * 0.5;
            const halflineY: number = (br.topleft.y + br.bottomRight.y) * 0.5;

            this.topLeft = new QuadNode(new BoundingRect(br.topleft.x, halflineX, br.topleft.y, halflineY), depth-1, this);
            this.topRight = new QuadNode(new BoundingRect(br.bottomRight.x, halflineX, br.topleft.y, halflineY), depth-1, this);
            this.bottomLeft = new QuadNode(new BoundingRect(br.topleft.x, halflineX, br.bottomRight.y, halflineY), depth-1, this);
            this.bottomRight = new QuadNode(new BoundingRect(br.bottomRight.x, halflineX, br.bottomRight.y, halflineY), depth-1, this);
        }
        if (parent)
            this.parentNode = parent;
    }

    public moveCollisionForm(form:CollisionForm)
    {
        this.forms.delete(form);
        // Find the root of QuadNode tree
        let myRoot:QuadNode = this;
        while (myRoot.parentNode) myRoot = myRoot.parentNode;
        myRoot.addCollisionForm(form);
    }

    public addCollisionForm(form:CollisionForm)
    {
        let addHere: boolean = true;
        let addTo: QuadNode|null = null;
        let nodesCount: number = 0;
        let formBr = form.boundingRect;
        for (let node of [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight])
        {
            if (node)
            {
                addHere = false;
                if (formBr.intersects(node.boundingRect))
                {
                    addTo = node;
                    ++nodesCount;
                }
            }
        }
        if (nodesCount >= 2)
            addHere = true;
        
        if (addHere)
        {
            //this.forms.push(form);
            this.forms.add(form);
            form.quadNode = this;
            form.onGeometryChanged.push({
                data: "quadnodefunc",
                f: (newVerts) => {
                    // Check if the form still belongs to the node
                    let belongsHere: boolean = true;
                    if (! this.boundingRect.contains(form.boundingRect))
                        belongsHere = false;
                    else {
                        let nodesCount: number = 0;
                        for (let node of [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight])
                        {
                            if (node)
                            {
                                if (formBr.intersects(node.boundingRect))
                                {
                                    addTo = node;
                                    ++nodesCount;
                                }
                            }
                        }
                        if (nodesCount < 2) 
                            belongsHere = false;
                    }
                    if (belongsHere)
                        return;

                    // Remove this form from our node
                    // first remove the notification on change
                    form.onGeometryChanged = form.onGeometryChanged.filter((val:geometryChangeFunc):boolean => {
                        if (typeof val === "function") return true;
                        if (val.data === "quadnodefunc") return false;
                        return true;
                    });
                    this.moveCollisionForm(form);
                }
            })
        }
        else
            addTo.addCollisionForm(form);
    }

    public removeCollisionForm(aForm: CollisionForm): boolean
    {
        aForm.quadNode = undefined;
        return this.forms.delete(aForm);
    }

    public searchNodeFor(point: Vector2D): QuadNode|null
    {
        if (! this.boundingRect.contains(point))
            return null;
        for (let node of [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight])
        {
            let res = node ? node.searchNodeFor(point) : null;
            if (res)
                return res;
        }
        return this;
    }
}

export class CollisionManager 
{
    private collisionForms: Set<CollisionForm> = new Set;
    private quadTree: QuadNode;

    constructor(x: number, y: number, width: number, height: number)
    {
        this.quadTree = new QuadNode(new BoundingRect(x, x+width, y, y+height), 5);
    }

    public removeStaticForm(aForm: CollisionForm): boolean
    {
        let res: boolean = this.collisionForms.delete(aForm);
        if (res)
        {
            const aTreeNode = aForm.quadNode;
            console.assert(aTreeNode.removeCollisionForm(aForm));
        }
        return res;
    }

    public addStaticForm(aForm: CollisionForm)
    {
        this.collisionForms.add(aForm);
        this.quadTree.addCollisionForm(aForm);
    }

    public collisionsWith(colForm: CollisionForm): CollisionForm[]
    {
        let nodesToTry: QuadNode[] = [];
        let resultArray: CollisionForm[] = [];
        let deepSearch = (node: QuadNode, collideForm: CollisionForm, resArray: QuadNode[]): void => {
            if (node.boundingRect.intersects(collideForm.boundingRect))
            {
                resArray.push(node);
                for (let aChild of [node.topLeft, node.topRight, node.bottomLeft, node.bottomRight])
                {
                    if (aChild) deepSearch(aChild, collideForm, resArray);
                }
            }
        };
        deepSearch(this.quadTree, colForm, nodesToTry);
        for (let aNode of nodesToTry)
        {
            for (let aForm of aNode.forms)
            {
                if (aForm.boundingRect.intersects(colForm.boundingRect) && aForm.intersects(colForm))
                    resultArray.push(aForm);
            }
        }
        return resultArray;
    }

    public formsIntersectingPoint(aPoint: Vector2D): CollisionForm[]
    {
        let resArray: CollisionForm[] = [];
        let iNode: QuadNode = this.quadTree.searchNodeFor(aPoint);
        const reprForm = new PointForm(this);
        reprForm.center = aPoint;
        while (iNode)
        {
            for (let aForm of iNode.forms)
            {
                if (aForm.intersects(reprForm))
                    resArray.push(aForm);
            }
            iNode = iNode.parentNode;
        }
        return resArray;
    }
}
