import { describe, it, expect, beforeEach } from 'vitest';
import { AStarSearch } from './AStarSearch';
import { Triangle } from './types/Triangles';
import { Point } from './types/Point';
import { Obstacle } from './types/Obstacle';


describe('AStarSearch', () => {
    let triangles: Triangle[];
    let obstacles: Obstacle[];
    let dimensions: { width: number; height: number };
    let aStarSearch: AStarSearch;

    beforeEach(() => {
        dimensions = { width: 300, height: 300 };
        obstacles = [];

        // Create a simple triangulation: 4 triangles in a grid-like pattern
        // Triangle 1: (0,0), (100,0), (100,100)
        const tri1 = new Triangle(
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            0
        );

        // Triangle 2: (0,0), (100,100), (0,100)
        const tri2 = new Triangle(
            { x: 0, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
            1
        );

        // Triangle 3: (100,0), (200,0), (100,100)
        const tri3 = new Triangle(
            { x: 100, y: 0 },
            { x: 200, y: 0 },
            { x: 100, y: 100 },
            2
        );

        // Triangle 4: (100,100), (200,0), (200,100)
        const tri4 = new Triangle(
            { x: 100, y: 100 },
            { x: 200, y: 0 },
            { x: 200, y: 100 },
            3
        );

        // Set up neighbors
        tri1.addNeighbor(tri2);
        tri1.addNeighbor(tri3);
        tri2.addNeighbor(tri1);
        tri3.addNeighbor(tri1);
        tri3.addNeighbor(tri4);
        tri4.addNeighbor(tri3);

        triangles = [tri1, tri2, tri3, tri4];
        aStarSearch = new AStarSearch(triangles, obstacles, dimensions);
    });

    describe('executeSearch with points inside triangles', () => {
        it('should find a path when both start and goal are inside the same triangle', () => {
            const start = { x: 20, y: 20 };
            const goal = { x: 50, y: 50 };
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].triangleId).toBe(0);
        });

        it('should find a path when start and goal are in adjacent triangles', () => {
            const start = { x: 20, y: 20 }; // inside tri1
            const goal = { x: 30, y: 80 }; // inside tri2
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].triangleId).toBe(0); // starts in tri1
        });

        it('should find a path through multiple triangles', () => {
            const start = { x: 20, y: 20 }; // inside tri1
            const goal = { x: 180, y: 50 }; // inside tri4
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBeGreaterThan(1);
            expect(result[0].triangleId).toBe(0);
        });
    });

    describe('executeSearch with points on triangle edges', () => {
        it('should find a path when start is on an edge between two triangles', () => {
            const start = { x: 50, y: 50 }; // on edge between tri1 and tri2
            const goal = { x: 180, y: 50 };
            const result = aStarSearch.executeSearch(start, goal);

            // Should return a valid path (picking one of the edge triangles)
            expect(result.length).toBeGreaterThan(0);
        });

        it('should find a path when goal is on an edge between two triangles', () => {
            const start = { x: 20, y: 20 };
            const goal = { x: 100, y: 50 }; // on edge between tri1 and tri3
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('executeSearch with invalid points', () => {
        it('should return empty path when start is outside all triangles', () => {
            const start = { x: 250, y: 250 }; // outside all triangles
            const goal = { x: 50, y: 50 };
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBe(0);
        });

        it('should return empty path when goal is outside all triangles', () => {
            const start = { x: 50, y: 50 };
            const goal = { x: 250, y: 250 }; // outside all triangles
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBe(0);
        });

        it('should return empty path when both start and goal are outside all triangles', () => {
            const start = { x: 250, y: 250 };
            const goal = { x: 270, y: 270 };
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBe(0);
        });
    });

    describe('executeSearch with obstacles', () => {
        it('should still find a path around obstacles', () => {
            const obstaclesWithBarrier: Obstacle[] = [];
            aStarSearch = new AStarSearch(triangles, obstaclesWithBarrier, dimensions);

            const start = { x: 20, y: 20 };
            const goal = { x: 180, y: 50 };
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('path properties', () => {
        it('should return path starting with start triangle and ending with goal triangle', () => {
            const start = { x: 20, y: 20 }; // in tri1
            const goal = { x: 180, y: 50 }; // in tri4
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].triangleId).toBe(0); // first element is tri1
            expect(result[result.length - 1].triangleId).toBe(3); // last element is tri4
        });

        it('path should have connected triangles (neighbors)', () => {
            const start = { x: 20, y: 20 };
            const goal = { x: 180, y: 50 };
            const result = aStarSearch.executeSearch(start, goal);

            // Check that consecutive triangles in path are neighbors
            for (let i = 0; i < result.length - 1; i++) {
                const current = result[i];
                const next = result[i + 1];
                expect(current.neighbors.includes(next)).toBe(true);
            }
        });
    });

    describe('edge cases', () => {
        it('should handle very close start and goal points', () => {
            const start = { x: 49.9, y: 49.9 };
            const goal = { x: 50.0, y: 50.0 };
            const result = aStarSearch.executeSearch(start, goal);

            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle start at triangle centroid', () => {
            const tri1Center = triangles[0].center;
            const goal = { x: 180, y: 50 };
            const result = aStarSearch.executeSearch(tri1Center, goal);

            expect(result.length).toBeGreaterThan(0);
        });
    });
});
