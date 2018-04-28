export interface Vector2D
{
    x: number;
    y: number;
}

export function fdot(a: Vector2D, b:Vector2D) : number
{
    return a.x*b.x + a.y*b.y;
}

export function fadd(a: Vector2D, b: Vector2D) : Vector2D
{
    return {x: a.x + b.x, y: a.y + b.y};
}

export function fmul(a: Vector2D, b: number) : Vector2D
{
    return {x: a.x*b, y: a.y*b};
}

export function fsub(a: Vector2D, b: Vector2D) : Vector2D
{
    return fadd(a, fmul(b, -1.0));
}

export function normalize(a: Vector2D): Vector2D
{
    const dist: number = Math.sqrt(fdot(a, a));
    return fmul(a, 1.0/dist);
}

function normalToEdge(edgeVector: Vector2D): Vector2D
{
    const result = {
        x: - edgeVector.y,
        y: edgeVector.x
    };
    return normalize(result);
}

function prev(i, length)
{
    return i===0 ? length-1 : i-1;
}

function next(i, length)
{
    return i===length-1 ? 0 : i+1;
}

export function angle(a: Vector2D, b: Vector2D, c: Vector2D): number
{
    const ba:Vector2D = fsub(a, b);
    const bc:Vector2D = fsub(c, b);
    const idBa:Vector2D = normalize(ba);
    const idBc:Vector2D = normalize(bc);
    const n:Vector2D = normalToEdge(ba);
    const cosAlpha = fdot(idBa, idBc);
    const halfPlaneTest = fdot(idBc, n);
    if (halfPlaneTest < 0)
        return 2*Math.PI - Math.acos(cosAlpha);
    else
        return Math.acos(cosAlpha);
}

export function windTest(verts: Vector2D[]) : "cw" | "ccw"
{
    let accumAngle = 0;
    for (let i = 0; i < verts.length; ++i)
    {
        const prevIndex = i===0 ? verts.length-1 : i-1;
        const nextIndex = i===verts.length-1 ? 0 : i+1;
        accumAngle += Math.PI - angle(verts[prevIndex], verts[i], verts[nextIndex]);
    }
    if (accumAngle > 0)
        return "ccw";
    else
        return "cw";
}

export function convexTest(verts: Vector2D[]) : boolean
{
    for (let i = 0; i < verts.length; ++i)
    {
        const prevIndex = i===0 ? verts.length-1 : i-1;
        const nextIndex = i===verts.length-1 ? 0 : i+1;
        if (angle(verts[prevIndex], verts[i], verts[nextIndex]) > Math.PI)
            return false;
    }
    return true;
}

export function concavTest(verts: Vector2D[]) : boolean
{
    return !convexTest(verts);
}

export function convexSeparate(verts: Vector2D[]) : Vector2D[][]
{
    if (convexTest(verts))
        return [verts];

    let sepI: number = 0;
    let foundAngle = false;

    for (let i = 0; i < verts.length; ++i)
    {
        const prevIndex = prev(i, verts.length);
        const nextIndex = next(i, verts.length);
        if (angle(verts[prevIndex], verts[i], verts[nextIndex]) > Math.PI)
        {
            sepI = i;
            foundAngle = true;
            break;
        }
    }
    if (!foundAngle)
        throw new Error("your math is wrong");

    // Angle at sepI is >180°
    let testIndex = prev(prev(sepI, verts.length), verts.length);
    let prevTestIndex = undefined;

    // Always terminates: compare with if-statement in for-loop above
    while(angle(verts[prev(sepI, verts.length)], verts[sepI], verts[testIndex]) < Math.PI) {
        prevTestIndex = testIndex;
        testIndex = prev(testIndex, verts.length);
    }

    if (typeof prevTestIndex === "undefined")
        throw new Error("something is seriously wrong with my math");

    let poly1 = [];
    if (prevTestIndex > sepI)
    {
        poly1 = verts.slice(0, sepI+1);
        poly1 = poly1.concat(verts.slice(prevTestIndex));
    }
    else
    {
        poly1 = verts.slice(prevTestIndex, sepI+1);
    }
    poly1 = convexSeparate(poly1);
    let poly2 = [];
    if (prevTestIndex > sepI)
    {
        poly2 = verts.slice(sepI, prevTestIndex+1);
    }
    else
    {
        poly2 = verts.slice(0, prevTestIndex+1);
        poly2 = poly2.concat(verts.slice(sepI));
    }
    poly2 = convexSeparate(poly2);

    return poly1.concat(poly2);
}

export class IntersectResult
{
    public result: boolean = false;
    public colinear: boolean = false;
    public point: Vector2D;
    public acoeff: number = 0;
    public bcoeff: number = 0;

    public data: any = undefined;

    constructor(isIntersect: boolean)
    {
        this.result = isIntersect;
    }
}

export function lineIntersect(a: Vector2D, aDir: Vector2D, b: Vector2D, bDir: Vector2D): IntersectResult
{
    let realMargin: number = 0.01;

    const aNorm: Vector2D = normalToEdge(aDir);
    const bNorm: Vector2D = normalToEdge(bDir);

    const da: number = fdot(a, aNorm);
    const db: number = fdot(b, bNorm);

    // Solve system of linear equations:
    // x * bNorm = db
    // x * aNorm = da
    const determinant: number = bNorm.x*aNorm.y - bNorm.y*aNorm.x;
    if (Math.abs(determinant) < realMargin)
    {
        // Practically determinant === 0
        // The ray and segment are either parallel or on the same line
        // 1. Find the distance between the lines
        const dfactor = fdot(b, aNorm) - fdot(a, aNorm);
        if (Math.abs(dfactor) > realMargin)
            return new IntersectResult(false);
        
        let result = new IntersectResult(true);
        // find acoeff such that a+aDir*acoeff == b
        if (Math.abs(aDir.x) > Math.abs(aDir.y))
            result.acoeff = (b.x - a.x) / aDir.x;
        else
            result.acoeff = (b.y - a.y) / aDir.y;
        
        // find bcoeff such that b+bDir*bcoeff == a
        if (Math.abs(bDir.x) > Math.abs(bDir.y))
            result.bcoeff = (a.x - b.x) / bDir.x;
        else
            result.bcoeff = (a.y - b.y) / bDir.y;
        result.point = a;
        result.colinear = true;
        return result;
    }

    let result = new IntersectResult(true);

    result.point = {
        x: (aNorm.y*db - bNorm.y*da) / determinant,
        y: (-aNorm.x*db + bNorm.x*da) / determinant
    };
    // find acoeff such that a + aDir*acoeff = result.point
    if (Math.abs(aDir.x) > Math.abs(aDir.y))
        result.acoeff = (result.point.x - a.x) / aDir.x;
    else
        result.acoeff = (result.point.y - a.y) / aDir.y;

    // find bcoeff such that b + bDir*bcoeff = result.point
    if (Math.abs(bDir.x) > Math.abs(bDir.y))
        result.bcoeff = (result.point.x - b.x) / bDir.x;
    else
        result.bcoeff = (result.point.y - b.y) / bDir.y;
    
    return result;
}

export class NodeData
{
    public position: Vector2D;
    public edges: EdgeSequence[] = [];
    public nodeLoops: Vector2D[][] = [];
}
export class EdgeSequence
{
    public edgePoints: Vector2D[] = [];
    public nextNode: NodeData;
    public visited: boolean = false;
}

export function polyIntersect(verts1: Vector2D[], verts2: Vector2D[]): NodeData[]
{
    let intersectPoints: NodeData[] = [];
    let nexti = i => next(i, verts1.length);
    let nextj = j => next(j, verts2.length); 

    // Arrays of intersect result for each edge
    let edges1: Map<number, IntersectResult[]> = new Map; 
    let edges2: Map<number, IntersectResult[]> = new Map;
    for (let i = 0; i < verts1.length; ++i)
        edges1.set(i, []);
    for (let i = 0; i < verts2.length; ++i)
        edges2.set(i, []);
    for (let i = 0; i < verts1.length; ++i)
    {
        // For the current edge (verts1[i], verts1[next(i)]), find all intersections with poly 2 
        for (let j = 0; j < verts2.length; ++j)
        {
            const intResult = lineIntersect(verts1[i], fsub(verts1[nexti(i)], verts1[i]), 
            verts2[j], fsub(verts2[nextj(j)], verts2[j]));
            if (intResult.result && intResult.acoeff>0 && intResult.acoeff<1 && intResult.bcoeff>0 && intResult.bcoeff<1)
            {
                let node = new NodeData;
                node.position = intResult.point;
                intersectPoints.push(node);
                intResult.data = node;
                edges1.get(i).push(intResult);
                edges2.get(j).push(intResult);
            }
        }
    }

    function createEdgeSequences(edgeIntResults: Map<number, IntersectResult[]>, polyVertices: Vector2D[]) {
        if (edgeIntResults.size === 0)
        {
            // no intersections here, 
            return;
        }

        let currentEdgeSequence: EdgeSequence;
        let lastEdgeIndex: number;
        let firstCutEdgeIndex: number;
        let firstNode: NodeData;
        for (let [edgeIndex, edgeIntersections] of edgeIntResults)
        {
            if (edgeIntersections.length === 0)
                continue;
            if (typeof firstCutEdgeIndex === "undefined")
                firstCutEdgeIndex = edgeIndex;
            edgeIntersections.sort((a, b) => a.acoeff-b.acoeff);
                // Finish currentEdgeSequence
            if (currentEdgeSequence) for (let i = lastEdgeIndex+1; i <= edgeIndex; ++i)
            {
                //console.log(`   -> new edge point:(${polyVertices[i].x}, ${polyVertices[i].y})`);
                currentEdgeSequence.edgePoints.push(polyVertices[i]);
            }
            // create edge sequences, get node at the start
            for (let edgeInt of edgeIntersections)
            {
                let myNode = edgeInt.data as NodeData;
                if (typeof firstNode === "undefined")
                    firstNode = myNode;
                if (currentEdgeSequence)
                {
                    currentEdgeSequence.nextNode = myNode;
                    myNode.edges.push(currentEdgeSequence);
                }
                //console.log("A new edge sequence added")
                currentEdgeSequence = new EdgeSequence;
                myNode.edges.push(currentEdgeSequence);
            }
            lastEdgeIndex = edgeIndex;
        }
        // Fill the very last edgeSequence
        for (let i = next(lastEdgeIndex, polyVertices.length); i != firstCutEdgeIndex; i = next(i, polyVertices.length))
        {
            //console.log(`   -> new edge point:(${polyVertices[i].x}, ${polyVertices[i].y})`);
            currentEdgeSequence.edgePoints.push(polyVertices[i]);
        }
        //console.log(`   -> new edge point:(${polyVertices[firstCutEdgeIndex].x}, ${polyVertices[firstCutEdgeIndex].y})`);
        currentEdgeSequence.edgePoints.push(polyVertices[firstCutEdgeIndex]);
        currentEdgeSequence.nextNode = firstNode;
        firstNode.edges.push(currentEdgeSequence);
    };
    //console.log("Creating edgesequences from 1st polygon")
    createEdgeSequences(edges1, verts1);
    //console.log("Creating edgesequences from 2nd polygon")
    createEdgeSequences(edges2, verts2);

    // Go over the nodes, make sure that edges[] are sorted properly
    for (let n of intersectPoints)
    {
        const edgeSeqAngle = (a: EdgeSequence): number => {
            let edgePoint = a.nextNode === n ? a.edgePoints[a.edgePoints.length - 1] : a.edgePoints[0];
            if (typeof edgePoint === "undefined")
            {
                // Find a node that connects to n via a
                if (a.nextNode !== n)
                    edgePoint = a.nextNode.position;
                else
                {
                    const sourceNode = intersectPoints.find(candidate => candidate !== n && candidate.edges.indexOf(a) !== -1);
                    edgePoint = sourceNode.position;
                }
            }
            return angle(fadd(n.position, {x: 0, y: -1}), n.position, edgePoint);
        }
        n.edges.sort((a, b) => edgeSeqAngle(b) - edgeSeqAngle(a));
    }

    return intersectPoints;
}

export function union(verts1: Vector2D[], verts2: Vector2D[]) : Vector2D[][]
{
    const intNodes : NodeData[] = polyIntersect(verts1, verts2);
    let unionLoops : Vector2D[][] = [];
    for (let node of intNodes)
    {
        while (true)
        {
            let myLoop : Vector2D[] = [];
            // Find an unvisited edgeSequence that starts in this node
            let mySeq = node.edges.find(val => val.nextNode !== node && !val.visited);
            if (typeof mySeq === "undefined")
                break;
            myLoop.push(node.position);
            mySeq.visited = true;
            // Walk along edge loop to the next node
            while(mySeq.nextNode !== node)
            {
                const nextNode = mySeq.nextNode;
                // helper to get next index in nextNode.edges
                const nextI = i => (i == nextNode.edges.length - 1) ? 0 : (i + 1);

                myLoop = myLoop.concat(mySeq.edgePoints);
                myLoop.push(nextNode.position);
                // find the next edge sequence in the loop
                // first find index of our current edge sequence
                let seqIndex = nextNode.edges.findIndex(val => val === mySeq);
                let nestCounter = 0;
                // then look in nextNode.edges[] for the corresponding edge seq in the loop
                let seqFoundGuard = false;
                for (let i = nextI(seqIndex); i !== seqIndex; i = nextI(i))
                {
                    // We found the edge seq, if it's pointing away and the nesting counter is 0
                    if (nextNode.edges[i].nextNode !== nextNode && nestCounter === 0)
                    {
                        mySeq = nextNode.edges[i];
                        console.assert(!mySeq.visited, "Edge sequence shouldn't be visited");
                        mySeq.visited = true;
                        seqFoundGuard = true;
                        break;
                    }
                    // modify the nesting counter
                    nestCounter += (nextNode.edges[i].nextNode === nextNode) ? 1 : -1;
                }
                console.assert(seqFoundGuard, "Next edge sequence couldn't be found");
            }

            node.nodeLoops.push(myLoop);
            const loopWind = windTest(myLoop);
            unionLoops.push(myLoop);
        }
    }
    return unionLoops;
}
