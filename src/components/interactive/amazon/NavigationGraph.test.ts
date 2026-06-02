import { describe, it, expect } from 'vitest';
import { NavigationGraph } from './NavigationGraph';
import { Obstacle } from './types/Obstacle';


describe('NavigationGraph testing', () => {
    it('should create a navigation graph without errors', () => {
        const start = { x: 0, y: 0 };
        const goal = { x: 100, y: 100 };
        const obstacles: Obstacle[] = [
            new Obstacle('1', 20, 20, 10, 10, { width: 200, height: 200 }),
            new Obstacle('2', 50, 50, 20, 20, { width: 200, height: 200 })
        ];
        const dimensions = { width: 200, height: 200 };

        const graph = new NavigationGraph(obstacles, dimensions);
        const result = graph.findPath(start, goal);

        expect(result.triangles.length).toBeGreaterThan(0);
        expect(result.curvePath.length).toBeGreaterThan(0);
    });
});