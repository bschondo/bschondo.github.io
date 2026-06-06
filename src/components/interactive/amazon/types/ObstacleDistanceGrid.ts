import { Obstacle } from "./Obstacle";
import { Point } from "./Point";


export class ObstacleDistanceGrid {
    private grid: number[][];
    private height: number;
    private width: number;

    constructor(obstacles: Obstacle[], dimensions: { width: number; height: number }, gridResolution?: number) {
        if (!gridResolution){
            gridResolution = Math.ceil(Math.min(dimensions.height, dimensions.width) * 0.01)
        }
        this.height = Math.ceil(dimensions.height / gridResolution);
        this.width = Math.ceil(dimensions.width / gridResolution);
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(Infinity));
        this.calculateDistances(obstacles, gridResolution);
    }

    public getClearance(point: Point): number {
        const gridX = Math.floor(point.x / (this.width));
        const gridY = Math.floor(point.y / (this.height));
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return 0; // Treat out-of-bounds as zero clearance
        }
        return this.grid[gridY][gridX];
    }

    private calculateDistances(obstacles: Obstacle[], gridResolution: number) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellCenter: Point = { x: x * gridResolution + gridResolution / 2, y: y * gridResolution + gridResolution / 2 };
                // distance to window border
                let minDistance = Math.min(cellCenter.x, this.width - cellCenter.x, cellCenter.y, this.height - cellCenter.y);

                for (const obstacle of obstacles) {
                    minDistance = Math.min(minDistance, obstacle.distanceTo(cellCenter));
                }

                this.grid[y][x] = minDistance;
            }
        }
    }
}