import { Point } from "./Point";

export class Triangle {
    readonly center: Point;
    readonly neighbors: Triangle[]= []
    
    constructor(readonly pointA: Point, readonly pointB: Point, readonly pointC: Point, readonly triangleId: number) {
        this.center = this.calculateCenter();
    }

    public addNeighbor(triangle: Triangle): void {
        if(!this.neighbors.includes(triangle)) {
            this.neighbors.push(triangle);
        }
    }

    public vertices(): Point[] {
        return [this.pointA, this.pointB, this.pointC];
    }

    public desmosPolygonString(): string {
        return `polygon((${this.pointA.x}, ${this.pointA.y}), (${this.pointB.x}, ${this.pointB.y}), (${this.pointC.x}, ${this.pointC.y}))`;
    }

    private calculateCenter(): Point {
        const x = (this.pointA.x + this.pointB.x + this.pointC.x) / 3;
        const y = (this.pointA.y + this.pointB.y + this.pointC.y) / 3;
        return { x, y };
    }
}