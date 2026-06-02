import { Point } from './types/Point';
import { Triangle } from './types/Triangles';
import { Obstacle } from './types/Obstacle';
import { MotionProfile } from './types/MotionProfile';

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
    constructor(private obstacles: Obstacle[], private readonly dimensions: { width: number; height: number }) {}

    public optimize(waypoints: Point[], trianglePath: Triangle[], motionProfile: MotionProfile): PathOptimizerResult {
        const prunedWaypoints = this.pruneWaypointsInTrianglePath(waypoints, trianglePath);
        const optimizedWaypoints = this.optimizeWaypoints(prunedWaypoints, motionProfile);
        const curvePath = this.buildCurvePath(optimizedWaypoints);
        return { waypoints: optimizedWaypoints, curvePath };
    }

    private pruneWaypointsInTrianglePath(waypoints: Point[], trianglePath: Triangle[]): Point[] {
        if (waypoints.length <= 3) {
            return waypoints;
        }

        const keepFlags = Array(waypoints.length).fill(true);
        let changed = true;

        while (changed) {
            changed = false;
            let prevKeptIndex = 0;

            for (let waypointIndex = 1; waypointIndex < waypoints.length - 1; waypointIndex++) {
                if (!keepFlags[waypointIndex]) {
                    continue;
                }

                const nextKeptIndex = this.findNextKeptIndex(keepFlags, waypointIndex);
                if (nextKeptIndex === -1) {
                    continue;
                }

                const triangleIndex = waypointIndex - 1;
                const triangle = trianglePath[triangleIndex];
                if (!triangle) {
                    continue;
                }

                const fromPoint = waypoints[prevKeptIndex];
                const toPoint = waypoints[nextKeptIndex];

                if (this.segmentIntersectsTriangle(fromPoint, toPoint, triangle)) {
                    keepFlags[waypointIndex] = false;
                    changed = true;
                }

                prevKeptIndex = waypointIndex;
            }
        }

        return waypoints.filter((_, index) => keepFlags[index]);
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
        if (waypoints.length < 3) {
            return waypoints;
        }

        let bestWaypoints = waypoints.map(point => ({ ...point }));
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
                    const offsetPoint = this.clampPoint({
                        x: originalPoint.x + direction.x,
                        y: originalPoint.y + direction.y
                    });

                    const candidateWaypoints = bestWaypoints.map((point, idx) => idx === index ? offsetPoint : { ...point });
                    const candidateCurve = this.buildCurvePath(candidateWaypoints);
                    if (!this.isCurveSafe(candidateCurve)) {
                        continue;
                    }

                    const candidateCost = this.computeCurveTravelTime(candidateWaypoints, motionProfile);
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
        if (waypoints.length < 2) {
            return [];
        }

        const tangents = waypoints.map((point, index) => {
            if (index === 0) {
                return {
                    x: waypoints[1].x - point.x,
                    y: waypoints[1].y - point.y
                };
            }
            if (index === waypoints.length - 1) {
                return {
                    x: point.x - waypoints[index - 1].x,
                    y: point.y - waypoints[index - 1].y
                };
            }

            return {
                x: (waypoints[index + 1].x - waypoints[index - 1].x) * 0.5,
                y: (waypoints[index + 1].y - waypoints[index - 1].y) * 0.5
            };
        });

        const segments: BezierSegment[] = [];

        for (let i = 0; i < waypoints.length - 1; i++) {
            const p0 = waypoints[i];
            const p3 = waypoints[i + 1];
            const cp1 = {
                x: p0.x + tangents[i].x / 3,
                y: p0.y + tangents[i].y / 3
            };
            const cp2 = {
                x: p3.x - tangents[i + 1].x / 3,
                y: p3.y - tangents[i + 1].y / 3
            };

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

    private computeCurveTravelTime(waypoints: Point[], motionProfile: MotionProfile): number {
        const curveSegments = this.buildCurvePath(waypoints);
        let travelTime = 0;

        for (const segment of curveSegments) {
            const sampled = this.sampleBezierSegment(segment);
            for (let i = 0; i < sampled.length - 1; i++) {
                const startPoint = sampled[i];
                const endPoint = sampled[i + 1];
                const distance = this.distance(startPoint, endPoint);
                const midpoint = {
                    x: (startPoint.x + endPoint.x) / 2,
                    y: (startPoint.y + endPoint.y) / 2
                };
                const clearance = this.getClearance(midpoint);
                const speed = motionProfile.speedForDistance(clearance);
                travelTime += distance / Math.max(speed, 0.001);
            }
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

    private isCurveSafe(curve: BezierSegment[]): boolean {
        for (const segment of curve) {
            const sampled = this.sampleBezierSegment(segment);
            for (const point of sampled) {
                if (this.obstacles.some(obstacle => obstacle.containsPoint(point))) {
                    return false;
                }
            }
        }
        return true;
    }

    private clampPoint(point: Point): Point {
        return {
            x: Math.max(0, Math.min(point.x, this.dimensions.width)),
            y: Math.max(0, Math.min(point.y, this.dimensions.height))
        };
    }

    private distance(a: Point, b: Point): number {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }
}
