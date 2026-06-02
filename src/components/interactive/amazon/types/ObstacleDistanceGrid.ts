import { Obstacle } from "./Obstacle";
import { Point } from "./Point";


export class ObstacleDistanceGrid {
    private grid: number[][];
    private height: number;
    private width: number;

    constructor(obstacles: Obstacle[], dimensions: { width: number; height: number }, gridResolution: number) {
        this.height = Math.ceil(dimensions.height / gridResolution);
        this.width = Math.ceil(dimensions.width / gridResolution);
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(Infinity));
        this.calculateDistances(obstacles, gridResolution);
    }

    private calculateDistances(obstacles: Obstacle[], gridResolution: number) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellCenter: Point = { x: x * gridResolution + gridResolution / 2, y: y * gridResolution + gridResolution / 2 };
                let minDistance = Infinity;

                for (const obstacle of obstacles) {
                    const distance = this.distanceToObstacle(cellCenter, obstacle);
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                }

                this.grid[y][x] = minDistance;
            }
        }
    }

    private distanceToObstacle(point: Point, obstacle: Obstacle): number {
        const dx = Math.max(obstacle.x - point.x, 0, point.x - (obstacle.x + obstacle.width));
        const dy = Math.max(obstacle.y - point.y, 0, point.y - (obstacle.y + obstacle.height));
        return Math.sqrt(dx * dx + dy * dy);
    }

}