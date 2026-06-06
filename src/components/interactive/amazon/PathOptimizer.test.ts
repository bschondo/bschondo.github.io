import { describe, it, expect } from 'vitest';
import { PathOptimizer } from './PathOptimizer';
import { Triangle } from './types/Triangles';
import { Point } from './types/Point';
import { Obstacle } from './types/Obstacle';
import { MotionProfile } from './types/MotionProfile';

describe('PathOptimizer', () => {
    const dimensions = { width: 200, height: 200 };
    const motionProfile: MotionProfile = {
        minSpeed: 1,
        maxSpeed: 10,
        minSpeedDistance: 10,
        maxSpeedDistance: 80,
        gridResolution: 5
    };


    it('when no obstacles optimize return a straight line path', () => {
        const start: Point = { x: 20, y: 20 };
        const goal: Point = { x: 80, y: 80 };

        const triangle1 = new Triangle(
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            0
        );
        const triangle2 = new Triangle(
            { x: 0, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
            1
        );


        const optimizer = new PathOptimizer([], dimensions);
        const result = optimizer.optimize(
            [start, goal],
            [triangle1, triangle2],
            motionProfile
        );

        expect(result.waypoints.length).toEqual(2);
        expect(result.waypoints[0]).toEqual(start);
        expect(result.waypoints[result.waypoints.length - 1]).toEqual(goal);
        expect(result.curvePath.length).toEqual(1);
        expect(result.curvePath[0]).toEqual({start, control1: { x: 40, y: 40 }, control2: { x: 60, y: 60 }, end: goal })
    });

    it('should return a safe curve path for a path with obstacles present', () => {
        const start: Point = { x: 10, y: 10 };
        const goal: Point = { x: 180, y: 10 };
        const triangle = new Triangle(
            { x: 0, y: 0 },
            { x: 200, y: 0 },
            { x: 100, y: 100 },
            0
        );
        const obstacle = new Obstacle('obstacle-1', 80, 30, 40, 40);

        const optimizer = new PathOptimizer([obstacle], dimensions);
        const result = optimizer.optimize([start, triangle.center, goal], [triangle], motionProfile);

        expect(result.waypoints.length).toBeGreaterThanOrEqual(2);
        expect(result.curvePath.length).toBeGreaterThan(0);
        expect(result.curvePath[0].start).toEqual(start);
        expect(result.curvePath[result.curvePath.length - 1].end).toEqual(goal);
        expect(result.curvePath.some(segment => obstacle.containsPoint(segment.start) || obstacle.containsPoint(segment.end))).toBe(false);
    });
});
