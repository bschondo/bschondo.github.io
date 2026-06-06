import { newClampedPoint, Point } from './types/Point';
import { Triangle } from './types/Triangles';
import { Obstacle } from './types/Obstacle';
import { MotionProfile, speedForDistance } from './types/MotionProfile';
import { ObstacleDistanceGrid } from './types/ObstacleDistanceGrid';

export interface BezierSegment {
    start: Point;
    control1: Point;
    control2: Point;
    end: Point;
}

export interface PathOptimizerResult {
    waypoints: Point[];
    curvePath: BezierSegment[];
}

export class PathOptimizer {
    private readonly obstacleDistanceGrid: ObstacleDistanceGrid;

    constructor(
        private readonly obstacles: Obstacle[], 
        private readonly dimensions: { width: number; height: number },
        obstacleDistanceGrid?: ObstacleDistanceGrid) {
            this.obstacleDistanceGrid = obstacleDistanceGrid != null ? obstacleDistanceGrid : new ObstacleDistanceGrid(obstacles, dimensions, 2);
        }

    public optimize(waypoints: Point[], trianglePath: Triangle[], motionProfile: MotionProfile): PathOptimizerResult {
        const prunedWaypoints = this.pruneWaypointsInTrianglePath(waypoints, trianglePath);
        const optimizedWaypoints = this.optimizeWaypoints(prunedWaypoints, motionProfile);
        const curvePath = this.buildCurvePath(optimizedWaypoints);
        return { waypoints: optimizedWaypoints, curvePath };
    }

    private pruneWaypointsInTrianglePath(waypoints: Point[], trianglePath: Triangle[]): Point[] {
        if (waypoints.length <= 2) {
            return waypoints;
        }

        const pruned: Point[] = [waypoints[0]];
        let currentIdx = 0;

        while (currentIdx < waypoints.length - 1) {
            let furthestVisibleIdx = currentIdx + 1;

            // Look ahead to find the furthest point we can directly connect to
            for (let nextIdx = currentIdx + 2; nextIdx < waypoints.length; nextIdx++) {
                const fromPoint = waypoints[currentIdx];
                const toPoint = waypoints[nextIdx];

                // Verify if the line segment stays entirely valid within your triangle channel
                if (this.isSegmentValid(fromPoint, toPoint, currentIdx, nextIdx, trianglePath)) {
                    furthestVisibleIdx = nextIdx;
                } else {
                    // If it fails, we cannot skip any further down this line
                    break;
                }
            }

            pruned.push(waypoints[furthestVisibleIdx]);
            currentIdx = furthestVisibleIdx; // Move our start point forward
        }

        return pruned;
    }

    private isSegmentValid(
        fromPoint: Point, 
        toPoint: Point, 
        startIdx: number, 
        endIdx: number, 
        trianglePath: Triangle[]
    ): boolean {
        // Determine which triangles correspond to this section of the path
        // Typically, waypoints match 1:1 or rely on a portal corridor
        const startTriangleIdx = startIdx; 
        const endTriangleIdx = endIdx - 1; 

        // Every triangle in this corridor segment must contain or intersect the line
        for (let i = startTriangleIdx; i <= endTriangleIdx; i++) {
            const triangle = trianglePath[i];
            if (!triangle) continue;

            // If the shortcut exits the walkable channel triangle, it is invalid
            if (!triangle.containsOrIntersectsSegment(fromPoint, toPoint)) {
                return false;
            }
        }

        return true;
    }



    private findNextKeptIndex(keepFlags: boolean[], index: number): number {
        for (let next = index + 1; next < keepFlags.length; next++) {
            if (keepFlags[next]) {
                return next;
            }
        }
        return -1;
    }

    private segmentIntersectsTriangle(p1: Point, p2: Point, triangle: Triangle): boolean {
        if (this.pointInTriangle(p1, triangle) || this.pointInTriangle(p2, triangle)) {
            return true;
        }

        const vertices = triangle.vertices();
        for (let i = 0; i < 3; i++) {
            const a = vertices[i];
            const b = vertices[(i + 1) % 3];
            if (this.segmentIntersectsSegment(p1, p2, a, b)) {
                return true;
            }
        }

        return false;
    }

    private segmentIntersectsSegment(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
        const orientation = (a: Point, b: Point, c: Point) =>
            (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

        const onSegment = (a: Point, b: Point, c: Point) =>
            Math.min(a.x, b.x) <= c.x && c.x <= Math.max(a.x, b.x) &&
            Math.min(a.y, b.y) <= c.y && c.y <= Math.max(a.y, b.y);

        const o1 = orientation(p1, p2, p3);
        const o2 = orientation(p1, p2, p4);
        const o3 = orientation(p3, p4, p1);
        const o4 = orientation(p3, p4, p2);

        if (o1 * o2 < 0 && o3 * o4 < 0) {
            return true;
        }
        if (o1 === 0 && onSegment(p1, p2, p3)) {
            return true;
        }
        if (o2 === 0 && onSegment(p1, p2, p4)) {
            return true;
        }
        if (o3 === 0 && onSegment(p3, p4, p1)) {
            return true;
        }
        if (o4 === 0 && onSegment(p3, p4, p2)) {
            return true;
        }

        return false;
    }

    private pointInTriangle(point: Point, triangle: Triangle): boolean {
        const [p0, p1, p2] = triangle.vertices();
        const area = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
        if (area === 0) {
            return false;
        }

        const s = 1 / (2 * area) * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * point.x + (p0.x - p2.x) * point.y);
        const t = 1 / (2 * area) * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * point.x + (p1.x - p0.x) * point.y);
        return s >= 0 && t >= 0 && 1 - s - t >= 0;
    }

    private optimizeWaypoints(waypoints: Point[], motionProfile: MotionProfile): Point[] {
        
        let bestWaypoints = structuredClone(waypoints);
        let bestCost = this.computeCurveTravelTime(bestWaypoints, motionProfile);
        let stepSize = Math.max(this.dimensions.width, this.dimensions.height) * 0.08;
        const minStep = 0.5;
        const directions = [
            { x: 0, y: 0 },
            { x: stepSize, y: 0 },
            { x: -stepSize, y: 0 },
            { x: 0, y: stepSize },
            { x: 0, y: -stepSize },
            { x: stepSize, y: stepSize },
            { x: stepSize, y: -stepSize },
            { x: -stepSize, y: stepSize },
            { x: -stepSize, y: -stepSize }
        ];

        while (stepSize >= minStep) {
            let improved = false;
            for (let index = 1; index < bestWaypoints.length - 1; index++) {
                const originalPoint = bestWaypoints[index];

                for (const direction of directions) {
                    const offsetPoint = newClampedPoint(originalPoint.x + direction.x, originalPoint.y + direction.y, this.dimensions);

                    if (offsetPoint === originalPoint) {
                        continue
                    }

                    const candidateWaypoints = bestWaypoints.map((point, idx) => idx === index ? offsetPoint : { ...point });
                    const candidatePath = this.sampleEntireCurve(candidateWaypoints);
                    if (!this.isPathSafe(candidatePath)) {
                        continue;
                    }

                    const candidateCost = this.computeCurveTravelTime(candidatePath, motionProfile);
                    if (candidateCost < bestCost) {
                        bestCost = candidateCost;
                        bestWaypoints = candidateWaypoints;
                        improved = true;
                        break;
                    }
                }
            }

            if (!improved) {
                stepSize *= 0.5;
                for (let i = 1; i < directions.length; i++) {
                    directions[i] = {
                        x: Math.sign(directions[i].x) * stepSize,
                        y: Math.sign(directions[i].y) * stepSize
                    };
                }
            }
        }

        return bestWaypoints;
    }

    private buildCurvePath(waypoints: Point[]): BezierSegment[] {
        // A curve requires at least a start point and an end point.
        if (waypoints.length < 2) {
            return [];
        }

        // Calculate tangent vectors for every waypoint to determine curve direction and speed.
        const tangents = waypoints.map((point, index) => {
            // First point: Tangent points directly toward the second point.
            if (index === 0) {
                return {
                    x: waypoints[1].x - point.x,
                    y: waypoints[1].y - point.y
                };
            }
            // Last point: Tangent points directly away from the second-to-last point.
            if (index === waypoints.length - 1) {
                return {
                    x: point.x - waypoints[index - 1].x,
                    y: point.y - waypoints[index - 1].y
                };
            }

            // Middle points (Catmull-Rom step): Look at previous and next points.
            // The tangent is half the distance between them, ensuring smooth transitions.
            return {
                x: (waypoints[index + 1].x - waypoints[index - 1].x) * 0.5,
                y: (waypoints[index + 1].y - waypoints[index - 1].y) * 0.5
            };
        });

        const segments: BezierSegment[] = [];

        // 3. Connect each pair of sequential waypoints with a cubic Bezier curve.
        for (let i = 0; i < waypoints.length - 1; i++) {
            const p0 = waypoints[i];     // Start anchor point of current segment
            const p3 = waypoints[i + 1]; // End anchor point of current segment
            
            // Control point 1 extends outward 1/3 of the distance along the start point's tangent.
            const cp1 = {
                x: p0.x + tangents[i].x / 3,
                y: p0.y + tangents[i].y / 3
            };
            
            // Control point 2 pulls backward 1/3 of the distance along the end point's tangent.
            const cp2 = {
                x: p3.x - tangents[i + 1].x / 3,
                y: p3.y - tangents[i + 1].y / 3
            };

            // Store the completed segment coordinates.
            segments.push({ start: p0, control1: cp1, control2: cp2, end: p3 });
        }

        return segments;
    }


    private evaluateCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
        const invT = 1 - t;
        const invT2 = invT * invT;
        const invT3 = invT2 * invT;
        const t2 = t * t;
        const t3 = t2 * t;

        return {
            x: invT3 * p0.x + 3 * invT2 * t * p1.x + 3 * invT * t2 * p2.x + t3 * p3.x,
            y: invT3 * p0.y + 3 * invT2 * t * p1.y + 3 * invT * t2 * p2.y + t3 * p3.y
        };
    }

    private sampleBezierSegment(segment: BezierSegment, samples = 16): Point[] {
        const result: Point[] = [];
        for (let j = 0; j <= samples; j++) {
            const t = j / samples;
            result.push(this.evaluateCubicBezier(segment.start, segment.control1, segment.control2, segment.end, t));
        }
        return result;
    }

    /**
     * Direct path sampler that calculates control points on the fly.
     * Reduces memory allocations when you only need the final coordinates.
     */
    private sampleEntireCurve(waypoints: Point[], samplesPerSegment = 16): Point[] {
        if (waypoints.length < 2) {
            return [];
        }

        const result: Point[] = [];
        const len = waypoints.length;

        // Pre-allocate array size for performance if needed, or push sequentially.
        // We loop through each segment between sequential waypoints.
        for (let i = 0; i < len - 1; i++) {
            const p0 = waypoints[i];
            const p3 = waypoints[i + 1];

            // 1. Calculate Tangent for the Start Point (p0) on the fly
            let tx0, ty0;
            if (i === 0) {
                tx0 = waypoints[1].x - p0.x;
                ty0 = waypoints[1].y - p0.y;
            } else {
                tx0 = (waypoints[i + 1].x - waypoints[i - 1].x) * 0.5;
                ty0 = (waypoints[i + 1].y - waypoints[i - 1].y) * 0.5;
            }

            // 2. Calculate Tangent for the End Point (p3) on the fly
            let tx3, ty3;
            if (i + 1 === len - 1) {
                tx3 = p3.x - waypoints[i].x;
                ty3 = p3.y - waypoints[i].y;
            } else {
                tx3 = (waypoints[i + 2].x - waypoints[i].x) * 0.5;
                ty3 = (waypoints[i + 2].y - waypoints[i].y) * 0.5;
            }

            // 3. Compute Control Points inline
            const cp1x = p0.x + tx0 / 3;
            const cp1y = p0.y + ty0 / 3;
            const cp2x = p3.x - tx3 / 3;
            const cp2y = p3.y - ty3 / 3;

            // 4. Sample this specific segment directly into the result array
            // To avoid duplicate points at segment junctions, start at j = 1 for subsequent segments.
            const startJ = (i === 0) ? 0 : 1;

            for (let j = startJ; j <= samplesPerSegment; j++) {
                const t = j / samplesPerSegment;
                
                // Inline evaluation or call to your existing evaluateCubicBezier method:
                result.push(this.evaluateCubicBezier(
                    p0, 
                    { x: cp1x, y: cp1y }, 
                    { x: cp2x, y: cp2y }, 
                    p3, 
                    t
                ));
            }
        }

        return result;
    }

    private computeCurveTravelTime(sampledCurvePath: Point[], motionProfile: MotionProfile): number {
        let travelTime = 0;

        for (let i = 0; i < sampledCurvePath.length - 1; i++) {
            const startPoint = sampledCurvePath[i];
            const endPoint = sampledCurvePath[i + 1];
            const distance = this.distance(startPoint, endPoint);
            const midpoint = {
                x: (startPoint.x + endPoint.x) / 2,
                y: (startPoint.y + endPoint.y) / 2
            };
            // const clearance = this.obstacleDistanceGrid.getClearance(midpoint)
            const clearance = this.getClearance(midpoint);
            if (clearance <= 0) {
                return Infinity;
            }
            const speed = speedForDistance(motionProfile, clearance);
            travelTime += distance / Math.max(speed, 0.001);
        }
    

        return travelTime;
    }

    private getClearance(point: Point): number {
        let clearance = Math.max(
            0,
            Math.min(point.x, this.dimensions.width - point.x, point.y, this.dimensions.height - point.y)
        );

        for (const obstacle of this.obstacles) {
            const dx = Math.max(obstacle.x - point.x, 0, point.x - (obstacle.x + obstacle.width));
            const dy = Math.max(obstacle.y - point.y, 0, point.y - (obstacle.y + obstacle.height));
            clearance = Math.min(clearance, Math.hypot(dx, dy));
        }

        return clearance;
    }

    private isPathSafe(points: Point[]): boolean {
        for(const obstacle of this.obstacles) {
            for(const point of points) {
                if (obstacle.containsPoint(point)) {
                    return false;
                }
            }
        }
        return true;
    }

    private distance(a: Point, b: Point): number {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }
}
