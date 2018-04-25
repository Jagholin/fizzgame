import "chai"
export interface nodedescr {position: number[], edges: number[]};
export interface edgedescr {points: number[][], nextNode: number};
export interface resultMap {
    nodes: nodedescr[],
    edges: edgedescr[]
};

declare global {
    export namespace Chai {
        interface Assertion {
            intersectResult: (resultMap)=>Assertion;
        }
    }
}
