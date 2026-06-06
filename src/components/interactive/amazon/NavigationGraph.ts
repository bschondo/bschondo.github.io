import { Point as Poly2TriPoint, SweepContext, Triangle as Poly2TriTriangle} from 'poly2tri';
import * as turf from '@turf/turf';
import { Feature, MultiPolygon, Polygon} from 'geojson';
import { Point } from './types/Point';
import { Triangle } from './types/Triangles';
import { Obstacle } from './types/Obstacle';
import { MotionProfile } from './types/MotionProfile';
import { BezierSegment, PathOptimizer, PathOptimizerResult } from './PathOptimizer';
import { AStarSearch } from './AStarSearch';
import { ObstacleDistanceGrid } from './types/ObstacleDistanceGrid';

export interface NavigationPathResult {
    triangles: Triangle[];
    waypoints: Point[];
    curvePath: BezierSegment[];
}

const DEFAULT_MOTION_PROFILE: MotionProfile = {
    minSpeed: 1,
    maxSpeed: 10,
    minSpeedDistance: 10,
    maxSpeedDistance: 80,
    gridResolution: 5
};

export class NavigationGraph {
    readonly triangles: Triangle[];


    constructor(private readonly obstacles: Obstacle[], private readonly dimensions: { width: number; height: number }) {
        this.triangles = [];

        // Determine border points and holes for the mesh.
        const { polyCorners, innerHoles } = this.buildNavigationMesh(this.obstacles);

        const sweepContext = new SweepContext(polyCorners);

        // Directly feed the remaining isolated holes
        innerHoles.forEach(hole => {
            if (hole.length >= 3) {
                sweepContext.addHole(hole);
            }
        });

        // Compute the triangulation
        try {
            sweepContext.triangulate();
        } catch (err) {
            console.error("Triangulation failed. Winding orders might be flipped:", err);
            throw err;
        }

        // Map structures to the custom Triangle wrappers and build neighbor links
        this.buildTriangleMesh(sweepContext.getTriangles());
        console.log(`Successfully generated a CDT mesh containing ${this.triangles.length} triangles.`);
    }

    public findPath(start: Point, goal: Point, motionProfile: MotionProfile = DEFAULT_MOTION_PROFILE): NavigationPathResult {
        const distanceGrid = new ObstacleDistanceGrid(this.obstacles, this.dimensions, 2)
        const aStar = new AStarSearch(this.triangles, distanceGrid);
        const trianglePath = aStar.executeSearch(start, goal);
        if (trianglePath.length === 0) {
            return { triangles: [], waypoints: [], curvePath: [] };
        }

        const waypoints = [start, ...trianglePath.slice(1,-1).map(tri => tri.center), goal];
        const pathOptimizer = new PathOptimizer(this.obstacles, this.dimensions, distanceGrid);
        const optimizerResult: PathOptimizerResult = pathOptimizer.optimize(waypoints, trianglePath, motionProfile);

        return {
            triangles: trianglePath,
            waypoints: optimizerResult.waypoints,
            curvePath: optimizerResult.curvePath
        };
    }

    private buildNavigationMesh(obstacles: Obstacle[]): { polyCorners: Poly2TriPoint[], innerHoles: Poly2TriPoint[][] } {
        // Create base screen canvas polygon
        const windowPoly = turf.polygon([[
            [0, 0],
            [this.dimensions.width, 0],
            [this.dimensions.width, this.dimensions.height],
            [0, this.dimensions.height],
            [0, 0] // Closes the loop
        ]]);

        if (obstacles.length === 0) {
            return { polyCorners: this.convertToPoly2TriPoints(windowPoly.geometry.coordinates[0].slice(0, -1)), innerHoles: [] };
        }

        // Dissolve all obstacles into unified solid shapes
        const mergedObstacles = this.getMergedObstacles(obstacles);

        // Subtract obstacles from screen to get the exact walkable space
        const navigableSpace = turf.difference(turf.featureCollection([windowPoly, mergedObstacles]));
        if (!navigableSpace) throw new Error("No navigable space remains on screen!");

        // Parse the resulting GeoJSON geometry into poly2tri loops
        return this.parseNavigableSpace(navigableSpace);
    }

    /**
     * Unpacks Turf's nested coordinate outputs into outer borders vs inner islands.
     */
    private parseNavigableSpace(navigableSpace: Feature<Polygon | MultiPolygon>): { polyCorners: poly2tri.Point[], innerHoles: poly2tri.Point[][] } {
        const polyCorners: poly2tri.Point[] = [];
        const innerHoles: poly2tri.Point[][] = [];

        // Safely standardize Polygon vs MultiPolygon coordinates into a single structure
        const geometries = navigableSpace.geometry.type === 'MultiPolygon' 
            ? navigableSpace.geometry.coordinates 
            : [navigableSpace.geometry.coordinates];

        geometries.forEach((polygonCoords, geomIndex) => {
            polygonCoords.forEach((ring, ringIndex) => {
                // Strip the duplicate final coordinate because poly2tri forbids it
                const vertices = this.convertToPoly2TriPoints(ring.slice(0, -1));
                
                // The very first ring of the very first polygon is the outer screen frame
                if (geomIndex === 0 && ringIndex === 0) {
                    polyCorners.push(...vertices);
                } else {
                    // All subsequent rings are isolated holes or detached islands
                    innerHoles.push(vertices);
                }
            });
        });

        return { polyCorners, innerHoles };
    }

    private convertToPoly2TriPoints(coords: number[][]): Poly2TriPoint[] {
        return coords.map(coord => new Poly2TriPoint(coord[0], coord[1]));
    }

    private getMergedObstacles(obstacles: Obstacle[]): Feature<Polygon | MultiPolygon> {
        const turfPolygons = obstacles.map(obs => obs.toTurfPolygon());

        if (turfPolygons.length === 1) {
            return turfPolygons[0];
        }

        const collection = turf.featureCollection(turfPolygons);
        const mergedObstacles = turf.union(collection);
        if (!mergedObstacles) throw new Error("Failed to merge obstacles using Turf.");
        
        return mergedObstacles;
    }

    /**
     * Transforms raw poly2tri triangles into Triangle components and maps adjacent edges to set up neighbors.
     */
    private buildTriangleMesh(p2tTriangles: Poly2TriTriangle[]): void {
        const p2tToCustomMap = new Map<Poly2TriTriangle, Triangle>();

        // Map poly2tri triangles to custom wrappers
        p2tTriangles.forEach((p2tTri, sequentialId) => {
            const rawTri = p2tTri as any;
            const p1 = typeof rawTri.getPoint === 'function' ? rawTri.getPoint(0) : rawTri.GetPoint(0);
            const p2 = typeof rawTri.getPoint === 'function' ? rawTri.getPoint(1) : rawTri.GetPoint(1);
            const p3 = typeof rawTri.getPoint === 'function' ? rawTri.getPoint(2) : rawTri.GetPoint(2);

            // Filter out artificial micro-gaps from edge perturbations
            const area = Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2;
            if (area < 0.1) {
                return;
            }

            const v1 = { x: p1.x, y: p1.y };
            const v2 = { x: p2.x, y: p2.y };
            const v3 = { x: p3.x, y: p3.y };

            const customTri = new Triangle(v1, v2, v3, sequentialId);
            this.triangles.push(customTri);
            p2tToCustomMap.set(p2tTri, customTri);
        });

        // Connect up Neighbors securely
        p2tTriangles.forEach(p2tTri => {
            const currentCustomTri = p2tToCustomMap.get(p2tTri);
            if (!currentCustomTri) return;

            const rawTri = p2tTri as any;

            for (let i = 0; i < 3; i++) {
                const p2tNeighbor = typeof rawTri.getNeighbor === 'function' 
                    ? rawTri.getNeighbor(i) 
                    : rawTri.GetNeighbor(i);
                
                if (p2tNeighbor) {
                    const customNeighbor = p2tToCustomMap.get(p2tNeighbor);
                    if (customNeighbor) {
                        currentCustomTri.addNeighbor(customNeighbor);
                    }
                }
            }
        });
    }
}
