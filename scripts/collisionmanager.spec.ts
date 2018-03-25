import {expect} from "chai"
import "mocha"
import {fraysegment, Vector2D} from "./collisionmanager"

describe("Ray-Segment collision function", () => {

    interface TestDataItem 
    {
        ray: {start: Vector2D, direction: Vector2D},
        segment: {v1: Vector2D, v2: Vector2D},
        exresult: {result: boolean, inttype: string, intpoint?: Vector2D},
        description: string
    }

    const testData: TestDataItem[] = [
        {
            ray: {start: {x: 1.0, y: -1.0}, direction: {x: 9.0, y: 3.0}},
            segment: {v1: {x: 2.0, y: 3.0}, v2: {x: 5.0, y: 4.0}},
            exresult: {result: false, inttype: "parallel"},
            description: "parrallel test 1"
        },
        {
            ray: {start: {x: 1.0, y: -1.0}, direction: {x: -9.0, y: -3.0}},
            segment: {v1: {x: 2.0, y: 3.0}, v2: {x: 5.0, y: 4.0}},
            exresult: {result: false, inttype: "parallel"},
            description: "parrallel test 2"
        },
        {
            ray: {start: {x: 1.0, y: -1.0}, direction: {x: 0, y: -1.0}},
            segment: {v1: {x: 1.0, y: 1.0}, v2: {x: 1.0, y: 3.0}},
            exresult: {result: false, inttype: "colinear"},
            description: "colinear test 1"
        },
        {
            ray: {start: {x: 1.0, y: -1.0}, direction: {x: 0, y: 1.0}},
            segment: {v1: {x: 1.0, y: 1.0}, v2: {x: 1.0, y: 3.0}},
            exresult: {result: true, inttype: "colinear"},
            description: "colinear test 2"
        },
        {
            ray: {start: {x: 3.5, y: 2.0}, direction: {x: 1.0, y: 0}},
            segment: {v1: {x: 1.0, y: 2.0}, v2: {x: -2.0, y: 2.0}},
            exresult: {result: false, inttype: "colinear"},
            description: "colinear test 3"
        },
        {
            ray: {start: {x: 3.5, y: 2.0}, direction: {x: -0.7, y: 0}},
            segment: {v1: {x: 1.0, y: 2.0}, v2: {x: -2.0, y: 2.0}},
            exresult: {result: true, inttype: "colinear"},
            description: "colinear test 4"
        },
        {
            ray: {start: {x: 0.5, y: 1.5}, direction: {x: -1.0, y: 3.0}},
            segment: {v1: {x: 3.0, y: -2.0}, v2: {x: -1.5, y: -0.5}},
            exresult: {result: false, inttype: "wrongorientation", intpoint: {x: 1.5, y: -1.5}},
            description: "intersect test 1"
        },
        {
            ray: {start: {x: 0.5, y: 1.5}, direction: {x: 1.0, y: -3.0}},
            segment: {v1: {x: 3.0, y: -2.0}, v2: {x: -1.5, y: -0.5}},
            exresult: {result: true, inttype: "normal", intpoint: {x: 1.5, y: -1.5}},
            description: "intersect test 2"
        },
        {
            ray: {start: {x: 0.5, y: 1.5}, direction: {x: 1.0, y: -3.0}},
            segment: {v1: {x: 1.0, y: -4.0/3.0}, v2: {x: -1.5, y: -0.5}},
            exresult: {result: false, inttype: "outsidesegment", intpoint: {x: 1.5, y: -1.5}},
            description: "intersect test 3"
        }
    ];

    // test modifiers
    let swapSegmentVertices: (a: TestDataItem)=>TestDataItem = function(a: TestDataItem): TestDataItem
    {
        let result: TestDataItem = {
            ray: {start: {x: a.ray.start.x, y: a.ray.start.y}, direction: {x: a.ray.direction.x, y: a.ray.direction.y}},
            segment: {v1: {x: a.segment.v2.x, y: a.segment.v2.y}, v2: {x: a.segment.v1.x, y: a.segment.v1.y}},
            exresult: {result: a.exresult.result, inttype: a.exresult.inttype, intpoint: typeof a.exresult.intpoint === "undefined" ? undefined : {x: a.exresult.intpoint.x, y: a.exresult.intpoint.y}},
            description: a.description + " seg-swapped"
        }
        return result;
    }
    let mirrorX : (a: TestDataItem)=>TestDataItem = function(a: TestDataItem): TestDataItem
    {
        let result: TestDataItem = {
            ray: {start: {x: a.ray.start.x, y: -a.ray.start.y}, direction: {x: a.ray.direction.x, y: -a.ray.direction.y}},
            segment: {v1: {x: a.segment.v1.x, y: -a.segment.v1.y}, v2: {x: a.segment.v2.x, y: -a.segment.v2.y}},
            exresult: {result: a.exresult.result, inttype: a.exresult.inttype, intpoint: typeof a.exresult.intpoint === "undefined" ? undefined : {x: a.exresult.intpoint.x, y:-a.exresult.intpoint.y}},
            description: a.description + " mirror-x"
        }
        return result;
    }
    let mirrorY : (a: TestDataItem)=>TestDataItem = function(a: TestDataItem): TestDataItem
    {
        let result: TestDataItem = {
            ray: {start: {x: -a.ray.start.x, y: a.ray.start.y}, direction: {x: -a.ray.direction.x, y: a.ray.direction.y}},
            segment: {v1: {x: -a.segment.v1.x, y: a.segment.v1.y}, v2: {x: -a.segment.v2.x, y: a.segment.v2.y}},
            exresult: {result: a.exresult.result, inttype: a.exresult.inttype, intpoint: typeof a.exresult.intpoint === "undefined" ? undefined : {x:-a.exresult.intpoint.x, y: a.exresult.intpoint.y}},
            description: a.description + " mirror-y"
        }
        return result;
    }

    let modifiedTestData: TestDataItem[] = [];
    for (let t of testData)
    {
        modifiedTestData.push(t);
        modifiedTestData.push(swapSegmentVertices(t));
        modifiedTestData.push(mirrorX(t));
        modifiedTestData.push(mirrorY(t));
        modifiedTestData.push(mirrorX(swapSegmentVertices(t)));
        modifiedTestData.push(mirrorY(swapSegmentVertices(t)));
        modifiedTestData.push(mirrorY(mirrorX(swapSegmentVertices(t))));
    }

    for (let t of modifiedTestData)
    {
        it(t.description, () => {
            const result = fraysegment(t.ray, t.segment);
            expect(result).to.have.property("result", t.exresult.result);
            expect(result).to.have.property("inttype", t.exresult.inttype);
            if (typeof t.exresult.intpoint !== "undefined")
            {
                expect(result).to.have.property("intpoint");
                if (typeof result.intpoint !== "undefined")
                {
                    const diff = (result.intpoint.x-t.exresult.intpoint.x)*(result.intpoint.x - t.exresult.intpoint.x) +
                        (result.intpoint.y - t.exresult.intpoint.y)*(result.intpoint.y - t.exresult.intpoint.y);
                    expect(diff).lessThan(0.01);
                }
            }
        })
    }
})
