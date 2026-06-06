import { Obstacle } from "./types/Obstacle";
import { ObstacleDistanceGrid } from "./types/ObstacleDistanceGrid";
import { Point } from "./types/Point";
import { Triangle } from "./types/Triangles";


export class AStarSearch {
    constructor(private readonly triangles: Triangle[], private readonly obstacleDistanceGrid: ObstacleDistanceGrid) {}

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
        return this.triangles.filter(tri => tri.pointInTriangle(point));
    }

    private distance(a: Point, b: Point): number {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    private heuristic(triangle: Triangle, goal: Point): number {
        return this.distance(triangle.center, goal);
    }

    private getTraversalCost(from: Triangle, to: Triangle): number {
        const distance = this.distance(from.center, to.center);
        const clearance = Math.min(this.obstacleDistanceGrid.getClearance(from.center), this.obstacleDistanceGrid.getClearance(to.center));
        const penalty = clearance < 1 ? 1000 : 1 + Math.max(0, 1 - Math.min(clearance / 50, 1));
        return distance * penalty;
    }
}