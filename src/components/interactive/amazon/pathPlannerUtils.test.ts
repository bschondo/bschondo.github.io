import { describe, it, expect } from 'vitest';
import { getPathPlanningResult } from './pathPlannerUtils';

const corridorObstacles = [
    { id: '1', x: 100, y: 0, width: 50, height: 200 },
    { id: '2', x: 250, y: 260, width: 50, height: 200 }
];

const motionProfile = {
  minSpeed: 1,
  maxSpeed: 10,
  minSpeedDistance: 10,
  maxSpeedDistance: 80,
  gridResolution: 50,
  maxCurveAngle: 45
};

const isPointInsideObstacle = (point: { x: number; y: number }, obstacle: { x: number; y: number; width: number; height: number }) =>
  point.x >= obstacle.x && point.x <= obstacle.x + obstacle.width && point.y >= obstacle.y && point.y <= obstacle.y + obstacle.height;

describe('pathPlannerUtils regression', () => {
  it('finds a valid path through the narrow corridor case', () => {
    const start = { x: 50, y: 50 };
    const goal = { x: 950, y: 350 };
    const dimensions = { width: 1000, height: 400 };
    console.log('Regression debug: start, goal, dimensions, obstacles', { start, goal, dimensions, corridorObstacles });

    const result = getPathPlanningResult(start, goal, corridorObstacles, dimensions, motionProfile, { debug: true });

    console.log('Regression debug: result summary', {
      pathLength: result?.path.length,
      path: result?.path,
      legalTriangles: result?.legalTriangles.size,
      points: result?.points.length
    });

    expect(result).not.toBeNull();
    expect(result?.path.length).toBeGreaterThan(0);
    expect(result?.path[0]).toEqual(start);
    expect(result?.path[result.path.length - 1]).toEqual(goal);
    expect(result?.path.every(pt => !corridorObstacles.some(obs => isPointInsideObstacle(pt, obs)))).toBe(true);
  });
});
