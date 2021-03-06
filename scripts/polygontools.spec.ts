import { expect, use } from "chai";
import { resultMap }from "./chai_utils/polygonspec_utils";
import "mocha";
import * as T from "./polygontools";
import * as _ from "lodash";

describe("Polygon tools module", () => {
    /// Helper function to create Vector2D instances
    function array2Vector(myArr: number[]): T.Vector2D
    {
        return {
            x: myArr[0],
            y: myArr[1]
        };
    }

    it("winding test function", () => {
        let testCase1 = [[4, 3], [5, 1], [2, 1], [1, 4]];
        expect(T.windTest(testCase1.map(array2Vector))).to.be.equal("ccw");
        let testCase2 = testCase1.reverse();
        expect(T.windTest(testCase2.map(array2Vector))).to.be.equal("cw");
    })

    it("edge angle function", () => {
        let testCase1 = [[3, 4], [4, 1], [2, 1]].map(array2Vector);
        expect(T.angle(testCase1[0], testCase1[1], testCase1[2])).to.be.approximately(1.249, 0.01);
        expect(T.angle(testCase1[2], testCase1[1], testCase1[0])).to.be.approximately(2*Math.PI - 1.249, 0.01);
    })

    it("convex test function", () => {
        let testCase1 = [[4, 1], [2, 4], [6, 5], [7, 2], [7, -2], [3, -3]];
        let testCase2 = [[11, -1], [10, 3], [11, 6]];
        let testCase3 = [[20, 0], [16, -1], [13, 0]];
        let testCase4 = [[16, 3], [14, 5], [16, 8], [17, 5]];
        for (let a of [[testCase1, false], [testCase2, true], [testCase3, true], [testCase4, true]])
        {
            expect(T.convexTest(Array.prototype.map.call(a[0], array2Vector))).to.be.equal(a[1]);
        }
    })

    it("convex decomposition", () => {
        let testCase1 = [[4, 1], [2, 4], [6, 5], [7, 2], [7, -2], [3, -3]];
        let result = T.convexSeparate(testCase1.map(array2Vector));
        expect(result).to.be.lengthOf(2);
        expect(result).to.satisfy((res) => {
            for (let poly of res) if (T.concavTest(poly)) return false;
            return true;
        })
    })

    it("line intersection", () => {
        let testCase1 = [[1, 2], [6, -3], [6, 3], [-1, 4]];
        let res = T.lineIntersect.apply(this, testCase1.map(array2Vector));
        expect(res.result).to.equal(true);
        expect(res.colinear).to.equal(false);
        expect(res.point.x).to.be.approximately(7, 0.001);
        expect(res.point.y).to.be.approximately(-1, 0.001);
        expect(res.acoeff).to.be.approximately(1, 0.001);
        expect(res.bcoeff).to.be.approximately(-1, 0.001);
    })

    const vec2DEqual = (a: T.Vector2D, b: T.Vector2D) => Math.abs(a.x-b.x) < 0.001 && Math.abs(a.y-b.y) < 0.001;
    const cvec2DEqual = _.curry(vec2DEqual);

    const arrOrVec2D = a => _.isArray(a)?array2Vector(a):a;

    const vec2DArrEqual = (a: (number[]|T.Vector2D)[], b: (number[]|T.Vector2D)[]) => a.length === b.length && _.zip(a, b).every(val => vec2DEqual(arrOrVec2D(val[0]), arrOrVec2D(val[1])));
    const cvec2DArrEqual = _.curry(vec2DArrEqual);

    use((chai, utils) => {
        let Assertion = chai.Assertion;

        const compareIntResults = function (a: resultMap, b: T.NodeData[]) {
            // test size of b and position of all nodes
            this.assert(b.length === a.nodes.length,
                "Expected #{this} to have length #{exp} but got #{act}",
                "Expected #{this} not to have length #{exp}",
                a.nodes.length, // expected
                b.length // actual
            );
            this.assert(vec2DArrEqual(a.nodes.map(x => x.position), b.map(x => x.position)),
                "Expected #{this} nodes to have positions #{exp}, but got #{act}",
                "",
                b.map(x => x.position),
                a.nodes.map(x => x.position)
            );
            // Check that all nodes in b have right edges
            _.zip(a.nodes, b).forEach((x, nodeindex) => {
                _.zip(x[0].edges, x[1].edges).forEach((m, edgeseqindex) => {
                    let arrEqual = vec2DArrEqual(a.edges[m[0]].points, m[1].edgePoints);
                    // Check that all edges point to the right nextNode
                    let nextNodeEqual = b[a.edges[m[0]].nextNode] === m[1].nextNode;
                    //return arrEqual && nextNodeEqual;
                    this.assert(arrEqual, 
                        `Expected edge points to be #{exp} but got #{act}, while testing node ${nodeindex}`,
                        "",
                        a.edges[m[0]].points,
                        m[1].edgePoints
                    );
                    this.assert(nextNodeEqual,
                        `Expected next node to be #{exp} but got #{act}, while testing edgeseq [${edgeseqindex}]=${m[0]} in node ${nodeindex}`,
                        "",
                        a.edges[m[0]].nextNode,
                        b.indexOf(m[1].nextNode)
                    );
                });
            })
        }
        const ccompareIntResults = _.curry(compareIntResults);

        Assertion.addMethod("intersectResult", function(expected: resultMap) {
            let obj = this._obj;

            let testObj = new Assertion(obj);
            testObj.to.satisfy(_.isArray);

            compareIntResults.call(this, expected, obj as T.NodeData[]);
        });
        Assertion.addMethod("vectorLoop", function(expected: (T.Vector2D|number[])[]) {
            let obj = this._obj;

            let testObj = new Assertion(obj);
            testObj.to.satisfy(_.isArray);
            testObj.length(expected.length);
            const loopLength = expected.length;

            let bias = obj.findIndex(val => vec2DEqual(val, arrOrVec2D(expected[0])));
            this.assert(bias !== -1, "The loop doesn't have expected vertices",
            "", expected, obj);
            for (let i = 0; i < loopLength; ++i)
            {
                this.assert(vec2DEqual(obj[(bias+i)%loopLength], arrOrVec2D(expected[i])), 
                "Wrong vertex in the loop, expected #{exp}, but found #{act}",
                "",
                expected[i], obj[(bias+i)%loopLength]);
            }
        });
    });

    let atestCase1 = [[6, 1], [3, 3], [5, 5], [8, 4]];
    let btestCase1 = [[9, 1], [6, 3], [9, 5]];
    let atestCase2 = [[5, 5], [6, 4], [3, 2], [6, 0], [9, 1], [8, 4], [10, 4], [11, 1], [8, -1], [4, -1], [2, 2], [3, 4]];
    let btestCase2 = [[7, 7], [10, 6], [10, 5], [9, 3], [8.5, 3.55], [8, 5], [7, 5], [1, 3], [2, 5], [5, 7]];

    it("polygon intersection", () => {
        let expResult = {
            nodes: [
                {
                    position: [7.66667, 4.11111],
                    edges: [2, 0, 3, 1]
                },
                {
                    position: [6.92308, 2.38462],
                    edges: [0, 2, 1, 3]
                }
            ],
            edges: [{
                    points: [[6, 1], [3, 3], [5, 5]],
                    nextNode: 0
                },
                {
                    points: [[8, 4]],
                    nextNode: 1
                },
                {
                    points: [[6, 3]],
                    nextNode: 0
                },
                {
                    points: [[9, 5], [9, 1]],
                    nextNode: 1
                }
            ]
        };
        
        let res = T.polyIntersect(atestCase1.map(array2Vector), btestCase1.map(array2Vector));
        expect(res).to.be.intersectResult(expResult);

        let expResult2 = {
            nodes: [
                {
                    position: [5.5, 4.5],
                    edges: [4, 3, 7, 0]
                },
                {
                    position: [9.5, 4],
                    edges: [6, 1, 5, 2]
                },
                {
                    position: [8.34483, 4],
                    edges: [0, 7, 1, 6]
                },
                {
                    position: [2.8, 3.6],
                    edges: [2, 5, 3, 4]
                }
            ],
            edges: [
                {// 0
                    points: [[6, 4], [3, 2], [6, 0], [9, 1], [8, 4]],
                    nextNode: 2
                },
                {// 1
                    points: [],
                    nextNode: 1
                },
                {// 2
                    points: [[10, 4], [11, 1], [8, -1], [4, -1], [2, 2]],
                    nextNode: 3
                },
                {// 3
                    points: [[3, 4], [5, 5]],
                    nextNode: 0
                },
                {// 4
                    points: [],
                    nextNode: 3
                }, 
                {// 5
                    points: [[1, 3], [2, 5], [5, 7], [7, 7], [10, 6], [10, 5]],
                    nextNode: 1
                },
                {// 6
                    points: [[9, 3], [8.5, 3.55]],
                    nextNode: 2
                },
                {// 7
                    points: [[8, 5], [7, 5]],
                    nextNode: 0
                }
            ]
        };

        expect(T.convexTest(atestCase2.map(array2Vector))).to.be.false;
        expect(T.convexTest(btestCase2.map(array2Vector))).to.be.false;
        expect(T.windTest(atestCase2.map(array2Vector))).to.equal("ccw");
        expect(T.windTest(btestCase2.map(array2Vector))).to.equal("ccw");

        expect(T.polyIntersect(atestCase2.map(array2Vector), btestCase2.map(array2Vector))).to.be.intersectResult(expResult2);
    });

    it("Polygon union", (done) => {
        setTimeout(done, 500);
        expect(T.union(atestCase1.map(array2Vector), btestCase1.map(array2Vector))).to.satisfy(_.isArray);
    });
})