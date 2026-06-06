import { polygon } from "@turf/turf";
import { newClampedPoint, Point } from "./Point";
import { Triangle } from "./Triangles";

const MIN_SIZE = 20;

export class Obstacle {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public maxX: number;
    public maxY: number;

    constructor(public readonly id: string, x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxX = this.x + width;
        this.maxY = this.y + height;
    }

    public desmosPolygonString(): string {
        let result = "polygon(";
        for(const vertice of this.vertices()) {
            result = result.concat(`(${vertice.x}, ${vertice.y}),`);
        }
        result = result.substring(0,result.length - 1);
        result = result.concat(")")
        return result;
    }

    public updatePosition(point: Point): Obstacle {
        this.x = point.x;
        this.y = point.y;
        this.maxX = point.x + this.width;
        this.maxY = point.y + this.height;
        return this;
    }


    public updateSize(width: number, height: number): Obstacle {
        this.width = width;
        this.height = height;
        this.maxX = this.x + width;
        this.maxY = this.y + height;
        return this;
    }

    public containsPoint(point: Point, excludeEdge?: boolean): boolean {
        if(excludeEdge) {
            return point.x > this.x && point.x < this.maxX && point.y > this.y && point.y < this.maxY;
        }
        return point.x >= this.x && point.x <= this.maxX && point.y >= this.y && point.y <= this.maxY;
    }

    public vertices(): Point[] {
        return [
            { x: this.x, y: this.y },
            { x: this.maxX, y: this.y },
            { x: this.maxX, y: this.maxY },
            { x: this.x, y: this.maxY }
        ];
    }

    public toTurfPolygon() {
        const corners = this.vertices().map(point => [point.x, point.y]);
        return polygon([[...corners, [...corners[0]]]])
    }

    public distanceTo(point: Point): number {
        const dx = Math.max(this.x - point.x, 0, point.x - (this.x + this.width));
        const dy = Math.max(this.y - point.y, 0, point.y - (this.y + this.height));
        return Math.hypot(dx, dy);
    }
}