import { describe, it, expect } from 'vitest';
import { NavigationGraph } from './NavigationGraph';
import { Obstacle } from './types/Obstacle';


describe('NavigationGraph testing', () => {
    it('should create a navigation graph without errors', () => {
        const start = { x: 0, y: 0 };
        const goal = { x: 100, y: 100 };
        const obstacles: Obstacle[] = [
            new Obstacle('1', 20, 20, 10, 10),
            new Obstacle('2', 50, 50, 20, 20)
        ];
        const dimensions = { width: 200, height: 200 };

        const graph = new NavigationGraph(obstacles, dimensions);
        const result = graph.findPath(start, goal);

        expect(result.triangles.length).toBeGreaterThan(0);
        expect(result.curvePath.length).toBeGreaterThan(0);
    });

    it('should return a straight line path when no obstacles are present', () => {
        const start = { x: 0, y: 0 };
        const goal = { x: 100, y: 100 };
        const obstacles: Obstacle[] = [];
        const dimensions = { width: 200, height: 200 };

        const graph = new NavigationGraph(obstacles, dimensions);
        const result = graph.findPath(start, goal);

        expect(result.triangles.length).toBeGreaterThan(0);
        expect(result.curvePath.length).toEqual(1);
        expect(result.curvePath[0]).toEqual({start, control1: { x: 40, y: 40 }, control2: { x: 60, y: 60 }, end: goal })
    });

    it('should triangulate correct when obstacles close to wall', () => {
        const start = { x: 10, y: 10 };
        const goal = { x: 50, y: 10 };
        const obstacles: Obstacle[] = [
            new Obstacle('1', 20, 0, 20, 100)
        ];
        const dimensions = { width: 100, height: 100 };

        const graph = new NavigationGraph(obstacles, dimensions);
        const result = graph.findPath(start, goal);

        expect(result.waypoints).greaterThan(0);
        expect(result.triangles).greaterThan(0);
        expect(result.curvePath).greaterThan(0);
    })

});