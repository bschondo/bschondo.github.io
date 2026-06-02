import { Obstacle } from "./types/Obstacle";
import { Point } from "./types/Point";
import { Triangle } from "./types/Triangles";


export class AStarSearch {
    constructor(private triangles: Triangle[], private obstacles: Obstacle[], private dimensions: { width: number; height: number }) {}

    // A* search on the triangle graph to find a path from start to goal, returning a list of points representing the path
    // The cost should be the expected travel time along the line segment between triangle centers, which can be estimated 
    // using the obstacle distance grid to adjust speed based on proximity to obstacles and the motion profile
    public executeSearch(start: Point, goal: Point): Triangle[] {
        const startTriangles = this.findContainingTriangles(start);
        const goalTriangles = this.findContainingTriangles(goal);

        // Fail if start or goal is not inside any triangle (including edges)
        if (startTriangles.length === 0 || goalTriangles.length === 0) {
            return [];
        }

        // Pick the first containing triangle (could be any of them if on an edge)
        const startTriangle = startTriangles[0];
        const goalTriangle = goalTriangles[0];

        if (startTriangle === goalTriangle) {
            return [startTriangle];
        }

        const openSet: Triangle[] = [startTriangle];
        const cameFrom = new Map<Triangle, Triangle>();
        const gScore = new Map<Triangle, number>([[startTriangle, 0]]);
        const fScore = new Map<Triangle, number>([[startTriangle, this.heuristic(startTriangle, goal)]]);

        const getScore = (map: Map<Triangle, number>, tri: Triangle) => map.get(tri) ?? Infinity;

        while (openSet.length > 0) {
            openSet.sort((a, b) => getScore(fScore, a) - getScore(fScore, b));
            const current = openSet.shift()!;

            if (current === goalTriangle) {
                return this.reconstructPath(cameFrom, current);
            }

            for (const neighbor of current.neighbors) {
                const tentativeGScore = getScore(gScore, current) + this.getTraversalCost(current, neighbor);
                if (tentativeGScore < getScore(gScore, neighbor)) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeGScore);
                    fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, goal));
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return [];
    }

    private reconstructPath(cameFrom: Map<Triangle, Triangle>, current: Triangle): Triangle[] {
        const path: Triangle[] = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current)!;
            path.unshift(current);
        }
        return path;
    }

    private findContainingTriangles(point: Point): Triangle[] {
        return this.triangles.filter(tri => this.pointInTriangle(point, tri));
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

    private distance(a: Point, b: Point): number {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    private heuristic(triangle: Triangle, goal: Point): number {
        return this.distance(triangle.center, goal);
    }

    private getPointClearance(point: Point): number {
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

    private getTraversalCost(from: Triangle, to: Triangle): number {
        const distance = this.distance(from.center, to.center);
        const clearance = Math.min(this.getPointClearance(from.center), this.getPointClearance(to.center));
        const penalty = clearance < 1 ? 1000 : 1 + Math.max(0, 1 - Math.min(clearance / 50, 1));
        return distance * penalty;
    }
}