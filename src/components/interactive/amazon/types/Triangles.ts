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

    public containsOrIntersectsSegment(pointA: Point, pointB: Point) {
        const [p0, p1, p2] = this.vertices();

        // Check if the segment intersects any of the three triangle edges
        if (this.lineSegmentsIntersect(pointA, pointB, p0, p1)) return true;
        if (this.lineSegmentsIntersect(pointA, pointB, p1, p2)) return true;
        if (this.lineSegmentsIntersect(pointA, pointB, p2, p0)) return true;

        // If no edges are crossed, check if the segment is fully inside
        // Don't need to check both, if it doesn't intersect either both are in or both are out
        return this.pointInTriangle(pointA);
    }

    private lineSegmentsIntersect(segmentA: Point, segmentB: Point, edgeA: Point, edgeB: Point): boolean {
        const det = (segmentB.x - segmentA.x) * (edgeB.y - edgeA.y) - (segmentB.y - segmentA.y) * (edgeB.x - edgeA.x);
        if (det === 0) return false; // Parallel lines

        const u = ((edgeA.x - segmentA.x) * (edgeB.y - edgeA.y) - (edgeA.y - segmentA.y) * (edgeB.x - edgeA.x)) / det;
        const v = ((edgeA.x - segmentA.x) * (segmentB.y - segmentA.y) - (edgeA.y - segmentA.y) * (segmentB.x - segmentA.x)) / det;

        // Intersection occurs only if u and v are both between 0 and 1
        return u >= 0 && u <= 1 && v >= 0 && v <= 1;
    }

    public pointInTriangle(point: Point): boolean {
        const [p0, p1, p2] = this.vertices();
        const area = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
        if (area === 0) {
            return false;
        }

        const s = 1 / (2 * area) * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * point.x + (p0.x - p2.x) * point.y);
        const t = 1 / (2 * area) * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * point.x + (p1.x - p0.x) * point.y);
        return s >= 0 && t >= 0 && 1 - s - t >= 0;
    }


    private calculateCenter(): Point {
        const x = (this.pointA.x + this.pointB.x + this.pointC.x) / 3;
        const y = (this.pointA.y + this.pointB.y + this.pointC.y) / 3;
        return { x, y };
    }
}