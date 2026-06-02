import { newClampedPoint, Point } from "./Point";
import { Triangle } from "./Triangles";

const MIN_SIZE = 20;

export class Obstacle {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    private maxX: number;
    private maxY: number;

    

    constructor(public readonly id: string, x: number, y: number, width: number, height: number, dimensions: { width: number; height: number }) {
        const clampedPoint = newClampedPoint(x, y, dimensions);
        this.x = clampedPoint.x;
        this.y = clampedPoint.y;
        const [w, h] = this.constrainSize(width, height, dimensions);
        this.width = w;
        this.height = h;
        this.maxX = this.x + w;
        this.maxY = this.y + h;
    }

    public updatePosition(point: Point): Obstacle {
        this.x = point.x;
        this.y = point.y;
        this.maxX = point.x + this.width;
        this.maxY = point.y + this.height;
        return this;
    }

    private constrainSize(width: number, height: number, dimensions?: { width: number; height: number }): [number, number] {
        let finalWidth = width;
        let finalHeight = height;
        
        // Enforce minimum size so obstacles don't disappear or become too small to interact with
        finalWidth = Math.max(MIN_SIZE, finalWidth);
        finalHeight = Math.max(MIN_SIZE, finalHeight);
        
        // Clamp to viewport bounds so obstacle doesn't extend past edges
        if (dimensions) {
            finalWidth = Math.min(finalWidth, dimensions.width - this.x);
            finalHeight = Math.min(finalHeight, dimensions.height - this.y);
        }
        
        return [finalWidth, finalHeight];
    }

    public updateSize(width: number, height: number, dimensions?: { width: number; height: number }): Obstacle {
        const [finalWidth, finalHeight] = this.constrainSize(width, height, dimensions);
        this.width = finalWidth;
        this.height = finalHeight;
        this.maxX = this.x + finalWidth;
        this.maxY = this.y + finalHeight;
        return this;
    }

    public containsPoint(point: Point): boolean {
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

    // check if a triangle intersects the obstacle in 2D (while allowing edges to touch) using the Separating Axis Theorem (SAT)
    public intersectsTriangle(triangle: Triangle): boolean {
        const trianglePoints = triangle.vertices();
        const rectanglePoints = this.vertices();
        const axes = [...this.getAxes(trianglePoints), ...this.getAxes(rectanglePoints)];

        for (const axis of axes) {
            const proj1 = this.projectPolygon(trianglePoints, axis);
            const proj2 = this.projectPolygon(rectanglePoints, axis);

            // If projections do not overlap (only touching is allowed, not overlapping)
            if (proj1.max <= proj2.min || proj2.max <= proj1.min) {
                return false;
            }
        }

        return true;
    }

    // Helper to project the polygon onto an axis and get the min/max extents
    private projectPolygon(polygon: Point[], axis: Point): { min: number; max: number } {
        let dotProducts = polygon.map(p => p.x * axis.x + p.y * axis.y);
        return {
            min: Math.min(...dotProducts),
            max: Math.max(...dotProducts)
        };
    }

    // Helper to normalize a vector
    private normalize(v: Point): Point {
        const magnitude = Math.sqrt(v.x * v.x + v.y * v.y);
        if (magnitude === 0) return v;
        return { x: v.x / magnitude, y: v.y / magnitude };
    }

    // Helper to get the perpendicular axes of polygon edges for SAT
    private getAxes(polygon: Point[]): Point[] {
        const axes: Point[] = [];
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];
            
            // Edge vector
            const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            // Normal to the edge (perpendicular) - NORMALIZED
            const normal = this.normalize({ x: -edge.y, y: edge.x });
            axes.push(normal);
        }
        return axes;
    }
        

}