import { Delaunay } from 'd3-delaunay';
import { Point } from './types/Point';
import { Triangle } from './types/Triangles';
import { Obstacle } from './types/Obstacle';
import { ObstacleDistanceGrid } from './types/ObstacleDistanceGrid';
import { AStarSearch } from './AStarSearch';
import { MotionProfile } from './types/MotionProfile';
import { BezierSegment, PathOptimizer, PathOptimizerResult } from './PathOptimizer';

const DISTANCE_GRID_RESOLUTION = 5;
const WINDOW_BORDER_SAMPLE_POINTS = 3; // Sample points along the edges (besides the corners) of the window to improve pathfinding

export interface NavigationPathResult {
    triangles: Triangle[];
    waypoints: Point[];
    curvePath: BezierSegment[];
}

const DEFAULT_MOTION_PROFILE = new MotionProfile(1, 10, 10, 80, 5, 60);

export class NavigationGraph {
    readonly triangles: Triangle[];
    readonly obstacles: Obstacle[];
    private delaunay: Delaunay;
    private obstacleDistanceGrid: ObstacleDistanceGrid;

    constructor(obstacles: Obstacle[], private readonly dimensions: { width: number; height: number }) {
        const points = this.getTriangulationPoints(obstacles);

        this.obstacleDistanceGrid = new ObstacleDistanceGrid(obstacles, dimensions, DISTANCE_GRID_RESOLUTION);

        this.delaunay = Delaunay.from(points, (p: Point) => p.x, (p: Point) => p.y);
        this.triangles = [];
        this.obstacles = obstacles;

        // Extract triangles from Delaunay triangulation and filter out those that intersect obstacles
        for(let i = 0; i < this.delaunay.triangles.length/3; ++i) {
            const pointIndices = [
                this.delaunay.triangles[i*3],
                this.delaunay.triangles[i*3 + 1],
                this.delaunay.triangles[i*3 + 2]
            ];
            const triangle = [
                { x: this.delaunay.points[pointIndices[0] * 2], y: this.delaunay.points[pointIndices[0] * 2 + 1] },
                { x: this.delaunay.points[pointIndices[1] * 2], y: this.delaunay.points[pointIndices[1] * 2 + 1] },
                { x: this.delaunay.points[pointIndices[2] * 2], y: this.delaunay.points[pointIndices[2] * 2 + 1] }
            ];
            if(triangle.length !== 3) {
                throw new Error('Delaunay triangulation returned a non-triangle polygon');
            }
            const tri = new Triangle(triangle[0], triangle[1], triangle[2], i);
            if(this.isTriangleNavigable(tri)) {
                this.triangles.push(tri);
            }
        }

        // After all triangles are created, determine neighbors for pathfinding, ignoring those that were removed due to obstacles
        const triangleIdToIndex = new Map<number, number>();
        this.triangles.forEach((tri, filteredIndex) => {
            triangleIdToIndex.set(tri.triangleId, filteredIndex);
        });

        this.triangles.forEach(tri => {
            const neighborTriangleIds = this.getNeighborTriangles(tri.triangleId);
            neighborTriangleIds.forEach(neighborId => {
                const neighborIndex = triangleIdToIndex.get(neighborId);
                const neighborTri = neighborIndex !== undefined ? this.triangles[neighborIndex] : undefined;
                if (neighborTri) {
                    tri.addNeighbor(neighborTri);
                }
            });
        });

        console.log("All triangles and neighbors extracted");
    }

    public findPath(start: Point, goal: Point, motionProfile: MotionProfile = DEFAULT_MOTION_PROFILE): NavigationPathResult {
        const aStar = new AStarSearch(this.triangles, this.obstacles, this.dimensions);
        const trianglePath = aStar.executeSearch(start, goal);
        if (trianglePath.length === 0) {
            return { triangles: [], waypoints: [], curvePath: [] };
        }

        const waypoints = [start, ...trianglePath.map(tri => tri.center), goal];
        const pathOptimizer = new PathOptimizer(this.obstacles, this.dimensions);
        const optimizerResult: PathOptimizerResult = pathOptimizer.optimize(waypoints, trianglePath, motionProfile);

        return {
            triangles: trianglePath,
            waypoints: optimizerResult.waypoints,
            curvePath: optimizerResult.curvePath
        };
    }

    private getTriangulationPoints(obstacles: Obstacle[]): Set<Point> {
        const points = new Set<Point>();
        const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

        const addPoint = (x: number, y: number) => {
            const cx = clamp(x, 0, this.dimensions.width);
            const cy = clamp(y, 0, this.dimensions.height);
            points.add({ x: cx, y: cy });
        }

        // Add corners of the window
        addPoint(0, 0);
        addPoint(this.dimensions.width, 0);
        addPoint(0, this.dimensions.height);
        addPoint(this.dimensions.width, this.dimensions.height);

        // Sample points along the edges of the window to improve pathfinding around borders
        for(let i = 1; i <= WINDOW_BORDER_SAMPLE_POINTS; ++i) {
            const ratio = i / (WINDOW_BORDER_SAMPLE_POINTS + 1);
            addPoint(this.dimensions.width * ratio, 0);
            addPoint(this.dimensions.width * ratio, this.dimensions.height);
            addPoint(0, this.dimensions.height * ratio);
            addPoint(this.dimensions.width, this.dimensions.height * ratio);
        }

        // Add corners of obstacles
        obstacles.forEach(obs => {
            addPoint(obs.x, obs.y);
            addPoint(obs.x + obs.width, obs.y);
            addPoint(obs.x, obs.y + obs.height);
            addPoint(obs.x + obs.width, obs.y + obs.height);

            // const paddedCorners: [number, number][] = [
            //   [obs.x - PADDING, obs.y - PADDING],
            //   [obs.x + obs.width + PADDING, obs.y - PADDING],
            //   [obs.x - PADDING, obs.y + obs.height + PADDING],
            //   [obs.x + obs.width + PADDING, obs.y + obs.height + PADDING]
            // ];

            // paddedCorners.forEach(([px, py]) => addPoint(px, py));

            // addPoint(obs.x + obs.width / 2, obs.y - PADDING);
            // addPoint(obs.x + obs.width / 2, obs.y + obs.height + PADDING);
            // addPoint(obs.x - PADDING, obs.y + obs.height / 2);
            // addPoint(obs.x + obs.width + PADDING, obs.y + obs.height / 2);
        });

        return points;
    }

    private isTriangleNavigable(triangle: Triangle): boolean {
        return !this.obstacles.some(o => o.intersectsTriangle(triangle));
    }

    private getNeighborTriangles(triangleIndex: number): number[] {
        const halfedges = this.delaunay.halfedges;
        const neighbors: number[] = [];
        
        // A triangle has 3 half-edges (start indices: 3*t, 3*t+1, 3*t+2)
        for (let i = 0; i < 3; i++) {
            const halfedgeIndex = triangleIndex * 3 + i;
            
            // The opposite half-edge in the adjacent triangle
            const oppositeHalfedge = halfedges[halfedgeIndex];
            
            // If oppositeHalfedge is -1, this edge is on the convex hull (has no neighbor)
            if (oppositeHalfedge !== -1) {
                // Divide by 3 to get the adjacent triangle index
                const neighborTriangleIndex = Math.floor(oppositeHalfedge / 3);
                neighbors.push(neighborTriangleIndex);
            }
        }
        
        return neighbors;
    }

    private getNeighborTriangles(triangleIndex: number): number[] {
        const halfedges = this.delaunay.halfedges;
        const neighbors: number[] = [];
        
        // A triangle has 3 half-edges (start indices: 3*t, 3*t+1, 3*t+2)
        for (let i = 0; i < 3; i++) {
            const halfedgeIndex = triangleIndex * 3 + i;
            
            // The opposite half-edge in the adjacent triangle
            const oppositeHalfedge = halfedges[halfedgeIndex];
            
            // If oppositeHalfedge is -1, this edge is on the convex hull (has no neighbor)
            if (oppositeHalfedge !== -1) {
                // Divide by 3 to get the adjacent triangle index
                const neighborTriangleIndex = Math.floor(oppositeHalfedge / 3);
                neighbors.push(neighborTriangleIndex);
            }
        }
        
        return neighbors;
    }

}