import { Delaunay } from 'd3-delaunay';
import { Point } from './types/Point';
import { Obstacle } from './types/Obstacle';
import { Triangle } from './types/Triangles';
import { NavigationGraph } from './NavigationGraph';

// export interface Obstacle {
//   id: string;
//   x: number;
//   y: number;
//   width: number;
//   height: number;
// }

export interface MotionProfile {
  minSpeed: number;
  maxSpeed: number;
  minSpeedDistance: number;
  maxSpeedDistance: number;
  gridResolution: number;
  maxCurveAngle: number;
}

export interface PathPlannerResult {
  delaunay: Delaunay;
  path: Point[];
  legalTriangles: Set<number>;
  points: [number, number][];
}

const PADDING = 2;

const pointInTriangleCoords = (px: number, py: number, p0: Point, p1: Point, p2: Point) => {
  const area = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
  const s = 1 / (2 * area) * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * px + (p0.x - p2.x) * py);
  const t = 1 / (2 * area) * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * px + (p1.x - p0.x) * py);
  return s >= 0 && t >= 0 && 1 - s - t >= 0;
};

// const pointInObstacle = (p: Point, o: Obstacle) =>
//   p.x >= o.x && p.x <= o.x + o.width && p.y >= o.y && p.y <= o.y + o.height;

const orientation = (a: Point, b: Point, c: Point) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const onSegment = (a: Point, b: Point, c: Point) =>
  Math.min(a.x, b.x) <= c.x && c.x <= Math.max(a.x, b.x) &&
  Math.min(a.y, b.y) <= c.y && c.y <= Math.max(a.y, b.y);

const segmentsIntersect = (p1: Point, p2: Point, p3: Point, p4: Point) => {
  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  if (o1 === 0 && onSegment(p1, p2, p3)) return true;
  if (o2 === 0 && onSegment(p1, p2, p4)) return true;
  if (o3 === 0 && onSegment(p3, p4, p1)) return true;
  if (o4 === 0 && onSegment(p3, p4, p2)) return true;
  return false;
};

// const triangleIntersectsObstacle = (p0: Point, p1: Point, p2: Point, o: Obstacle) => {
//   if (pointInObstacle(p0, o) || pointInObstacle(p1, o) || pointInObstacle(p2, o)) return true;

//   const rectCorners = [
//     { x: o.x, y: o.y },
//     { x: o.x + o.width, y: o.y },
//     { x: o.x + o.width, y: o.y + o.height },
//     { x: o.x, y: o.y + o.height }
//   ];

//   const rectEdges: [Point, Point][] = [
//     [rectCorners[0], rectCorners[1]],
//     [rectCorners[1], rectCorners[2]],
//     [rectCorners[2], rectCorners[3]],
//     [rectCorners[3], rectCorners[0]],
//   ];

//   const triEdges: [Point, Point][] = [[p0, p1], [p1, p2], [p2, p0]];
//   for (const [a, b] of triEdges) {
//     for (const [c, d] of rectEdges) {
//       if (segmentsIntersect(a, b, c, d)) return true;
//     }
//   }

//   return rectCorners.some(corner => pointInTriangleCoords(corner.x, corner.y, p0, p1, p2));
// };

const getTrianglePoints = (delaunay: Delaunay, points: [number, number][], tIdx: number) => {
  const p0 = points[delaunay.triangles[tIdx * 3]];
  const p1 = points[delaunay.triangles[tIdx * 3 + 1]];
  const p2 = points[delaunay.triangles[tIdx * 3 + 2]];
  return [
    { x: p0[0], y: p0[1] },
    { x: p1[0], y: p1[1] },
    { x: p2[0], y: p2[1] }
  ] as [Point, Point, Point];
};

const computeCenters = (delaunay: Delaunay, points: [number, number][]) => {
  const centers: Point[] = [];
  const numTriangles = delaunay.triangles.length / 3;

  for (let t = 0; t < numTriangles; t++) {
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < 3; i++) {
      const pIdx = delaunay.triangles[t * 3 + i];
      cx += points[pIdx][0];
      cy += points[pIdx][1];
    }
    centers.push({ x: cx / 3, y: cy / 3 });
  }

  return centers;
};

const computeLegalTriangles = (
  delaunay: Delaunay,
  points: [number, number][],
  obstacles: Obstacle[],
  options?: { debug?: boolean }
) => {
  const legalTriangles = new Set<number>();
  const numTriangles = delaunay.triangles.length / 3;
  const debug = options?.debug === true;

  for (let t = 0; t < numTriangles; t++) {
    const [p0, p1, p2] = getTrianglePoints(delaunay, points, t);
    const insideObs = obstacles.some(o => triangleIntersectsObstacle(p0, p1, p2, o));
    if (debug && insideObs) {
      console.log('Triangle ${t} marked illegal:', { p0, p1, p2 });
      obstacles.forEach((o, idx) => {
        const intersects = triangleIntersectsObstacle(p0, p1, p2, o);
        console.log(`  Obstacle ${idx}:`, o, 'intersects:', intersects);
      });
    }
    if (!insideObs) legalTriangles.add(t);
  }

  return legalTriangles;
};

const findTriangleContainingPoint = (
  point: Point,
  delaunay: Delaunay,
  points: [number, number][]
) => {
  const numTriangles = delaunay.triangles.length / 3;
  for (let t = 0; t < numTriangles; t++) {
    if (pointInTriangleCoords(point.x, point.y, ...getTrianglePoints(delaunay, points, t))) {
      return t;
    }
  }
  return -1;
};

const findNearestLegalTriangle = (
  point: Point,
  centers: Point[],
  legalTriangles: Set<number>
) => {
  let nearest = -1;
  let minDist = Infinity;
  legalTriangles.forEach(t => {
    const center = centers[t];
    const d = Math.hypot(center.x - point.x, center.y - point.y);
    if (d < minDist) {
      minDist = d;
      nearest = t;
    }
  });
  return nearest;
};

const getClearance = (p: Point, obstacles: Obstacle[], dimensions: { width: number; height: number }) => {
  let minClearance = Infinity;
  const wallDist = Math.min(p.x, dimensions.width - p.x, p.y, dimensions.height - p.y);
  minClearance = Math.max(0, wallDist);

  obstacles.forEach(o => {
    const dx = Math.max(o.x - p.x, 0, p.x - (o.x + o.width));
    const dy = Math.max(o.y - p.y, 0, p.y - (o.y + o.height));
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < minClearance) minClearance = d;
  });

  return minClearance;
};

const getPointCost = (
  p: Point,
  motionProfile: MotionProfile,
  obstacles: Obstacle[],
  dimensions: { width: number; height: number }
) => {
  const clearance = getClearance(p, obstacles, dimensions);
  if (clearance < 2) return 1000;

  const { minSpeed, maxSpeed, minSpeedDistance, maxSpeedDistance } = motionProfile;
  let speed = maxSpeed;

  if (clearance <= minSpeedDistance) {
    speed = minSpeed;
  } else if (clearance < maxSpeedDistance) {
    const t = (clearance - minSpeedDistance) / (maxSpeedDistance - minSpeedDistance);
    speed = minSpeed + (maxSpeed - minSpeed) * t;
  }

  return 1 / speed;
};

const getEdgeCost = (
  p1: Point,
  p2: Point,
  getPointCostFn: (p: Point) => number
) => {
  const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const steps = 3;
  let totalTime = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = p1.x + (p2.x - p1.x) * t;
    const py = p1.y + (p2.y - p1.y) * t;
    totalTime += getPointCostFn({ x: px, y: py });
  }
  return distance * (totalTime / (steps + 1));
};

const aStarSearch = (
  startTri: number,
  goalTri: number,
  centers: Point[],
  delaunay: Delaunay,
  legalTriangles: Set<number>,
  getEdgeCostFn: (p1: Point, p2: Point) => number,
  goal: Point
) => {
  const openSet = [startTri];
  const cameFrom = new Map<number, number>();
  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();

  const dist = (p1: Point, p2: Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  gScore.set(startTri, 0);
  fScore.set(startTri, dist(centers[startTri], goal));

  let endTri = -1;

  while (openSet.length > 0) {
    openSet.sort((a, b) => (fScore.get(a) || Infinity) - (fScore.get(b) || Infinity));
    const current = openSet.shift()!;

    if (current === goalTri) {
      endTri = current;
      break;
    }

    for (let i = 0; i < 3; i++) {
      const edge = 3 * current + i;
      const neighbor = Math.floor(delaunay.halfedges[edge] / 3);
      if (neighbor >= 0 && legalTriangles.has(neighbor)) {
        const tentativeGScore = (gScore.get(current) || 0) + getEdgeCostFn(centers[current], centers[neighbor]);
        if (tentativeGScore < (gScore.get(neighbor) || Infinity)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(neighbor, tentativeGScore + dist(centers[neighbor], goal));
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }
  }

  if (endTri === -1) return [] as Point[];

  const path: Point[] = [];
  let curr = endTri;
  while (curr !== startTri && cameFrom.has(curr)) {
    path.push(centers[curr]);
    curr = cameFrom.get(curr)!;
  }
  path.push(centers[startTri]);
  path.reverse();
  return path;
};

const doesSegmentIntersectObstacle = (p1: Point, p2: Point, o: Obstacle) => {
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const closestX = clamp(p1.x, o.x, o.x + o.width);
  const closestY = clamp(p1.y, o.y, o.y + o.height);
  const dx = p1.x - closestX;
  const dy = p1.y - closestY;
  if (dx * dx + dy * dy === 0) return true;

  const steps = Math.max(2, Math.ceil(Math.hypot(p1.x - p2.x, p1.y - p2.y) / 5));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = p1.x + (p2.x - p1.x) * t;
    const py = p1.y + (p2.y - p1.y) * t;
    if (pointInObstacle({ x: px, y: py }, o)) return true;
  }

  return false;
};

const getLineSegmentCost = (
  p1: Point,
  p2: Point,
  obstacles: Obstacle[],
  getPointCostFn: (p: Point) => number,
  dimensions: { width: number; height: number }
) => {
  const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const steps = Math.max(2, Math.ceil(distance / 5));
  let totalTime = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = p1.x + (p2.x - p1.x) * t;
    const py = p1.y + (p2.y - p1.y) * t;

    if (px <= 0 || px >= dimensions.width || py <= 0 || py >= dimensions.height) return Infinity;
    if (obstacles.some(o => pointInObstacle({ x: px, y: py }, o))) return Infinity;

    totalTime += getPointCostFn({ x: px, y: py });
  }
  return distance * (totalTime / (steps + 1));
};

const prunePath = (
  aStarPath: Point[],
  getLineCostFn: (p1: Point, p2: Point) => number,
  getEdgeCostFn: (p1: Point, p2: Point) => number
) => {
  let prunedPath = [aStarPath[0]];
  let currentIdx = 0;

  while (currentIdx < aStarPath.length - 1) {
    let furthestVisible = currentIdx + 1;

    for (let j = aStarPath.length - 1; j > currentIdx + 1; j--) {
      const directCost = getLineCostFn(aStarPath[currentIdx], aStarPath[j]);
      if (directCost !== Infinity) {
        let meshCost = 0;
        for (let k = currentIdx; k < j; k++) {
          meshCost += getEdgeCostFn(aStarPath[k], aStarPath[k + 1]);
        }
        if (directCost < meshCost * 1.25) {
          furthestVisible = j;
          break;
        }
      }
    }

    prunedPath.push(aStarPath[furthestVisible]);
    currentIdx = furthestVisible;
  }

  return prunedPath;
};

const smoothPath = (
  prunedPath: Point[],
  obstacles: Obstacle[],
  motionProfile: MotionProfile,
  dimensions: { width: number; height: number }
) => {
  if (prunedPath.length < 3) return prunedPath;

  const smoothed: Point[] = [];
  const resolution = 20;
  const maxCurveRad = (motionProfile.maxCurveAngle * Math.PI) / 180;

  for (let i = 0; i < prunedPath.length - 1; i++) {
    const p0 = prunedPath[Math.max(i - 1, 0)];
    const p1 = prunedPath[i];
    const p2 = prunedPath[i + 1];
    const p3 = prunedPath[Math.min(i + 2, prunedPath.length - 1)];

    for (let j = 0; j < resolution; j++) {
      const t = j / resolution;
      const t2 = t * t;
      const t3 = t2 * t;

      let x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      let y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );

      const linearX = p1.x + (p2.x - p1.x) * t;
      const linearY = p1.y + (p2.y - p1.y) * t;
      const damping = Math.min(1, maxCurveRad / (Math.PI / 2));
      x = linearX + (x - linearX) * damping;
      y = linearY + (y - linearY) * damping;

      const inside = obstacles.some(o => pointInObstacle({ x, y }, o));
      if (inside) {
        x = linearX;
        y = linearY;
      }

      smoothed.push({ x, y });
    }
  }

  smoothed.push(prunedPath[prunedPath.length - 1]);
  return smoothed;
};

const isPathSafe = (pList: Point[], obstacles: Obstacle[]) => {
  for (let i = 0; i < pList.length - 1; i++) {
    const p1 = pList[i];
    const p2 = pList[i + 1];
    const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const steps = Math.ceil(distance / 2);
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const px = p1.x + (p2.x - p1.x) * t;
      const py = p1.y + (p2.y - p1.y) * t;
      if (obstacles.some(o => pointInObstacle({ x: px, y: py }, o))) {
        return false;
      }
    }
  }
  return true;
};

const getTrianglePoints_export = getTrianglePoints;

export const getPathPlanningResult = (
  start: Point,
  goal: Point,
  obstacles: Obstacle[],
  dimensions: { width: number; height: number },
  motionProfile: MotionProfile,
  options?: { debug?: boolean }
): PathPlannerResult | null => {
  const debug = options?.debug === true;
  if (dimensions.width === 0) return null;

  // TODO: We want this function to return a NavigationGraph object
  // TODO: Work on updating this function

  const points = buildTriangulationPoints(obstacles, dimensions);
  const delaunay = Delaunay.from(points);
  const centers = computeCenters(delaunay, points);
  const legalTriangles = computeLegalTriangles(delaunay, points, obstacles, { debug });

  const startCovered = obstacles.some(o => pointInObstacle(start, o));
  const goalCovered = obstacles.some(o => pointInObstacle(goal, o));
  if (startCovered || goalCovered) {
    if (debug) {
      console.log('PathPlanner debug: start/goal coverage', {
        start,
        goal,
        startCovered,
        goalCovered,
        obstacles,
        dimensions,
        pointsCount: points.length,
        triangleCount: delaunay.triangles.length / 3,
        legalTriangleCount: legalTriangles.size
      });
    }
    return { delaunay, path: [], legalTriangles, points };
  }

  let startTri = findTriangleContainingPoint(start, delaunay, points);
  let goalTri = findTriangleContainingPoint(goal, delaunay, points);

  if (debug) {
    const startTriPoints = startTri !== -1 ? getTrianglePoints(delaunay, points, startTri) : null;
    const goalTriPoints = goalTri !== -1 ? getTrianglePoints(delaunay, points, goalTri) : null;
    console.log('PathPlanner debug: initial triangles', {
      startTri,
      goalTri,
      startTriPoints,
      goalTriPoints,
      startLegal: startTri !== -1 && legalTriangles.has(startTri),
      goalLegal: goalTri !== -1 && legalTriangles.has(goalTri)
    });
  }

  if (startTri === -1 || !legalTriangles.has(startTri)) {
    const previous = startTri;
    startTri = findNearestLegalTriangle(start, centers, legalTriangles);
    if (debug) {
      console.log('PathPlanner debug: start fallback', {
        previousStartTri: previous,
        newStartTri: startTri,
        center: startTri !== -1 ? centers[startTri] : null
      });
    }
  }
  if (goalTri === -1 || !legalTriangles.has(goalTri)) {
    const previous = goalTri;
    goalTri = findNearestLegalTriangle(goal, centers, legalTriangles);
    if (debug) {
      console.log('PathPlanner debug: goal fallback', {
        previousGoalTri: previous,
        newGoalTri: goalTri,
        center: goalTri !== -1 ? centers[goalTri] : null
      });
    }
  }

  if (startTri === -1 || goalTri === -1) {
    if (debug) {
      console.log('PathPlanner debug: failed triangle lookup', {
        startTri,
        goalTri,
        legalTriangleCount: legalTriangles.size
      });
    }
    return { delaunay, path: [], legalTriangles, points };
  }

  const getPointCostFn = (p: Point) => getPointCost(p, motionProfile, obstacles, dimensions);
  const getEdgeCostFn = (p1: Point, p2: Point) => getEdgeCost(p1, p2, getPointCostFn);
  const getLineCostFn = (p1: Point, p2: Point) => getLineSegmentCost(p1, p2, obstacles, getPointCostFn, dimensions);

  const aStarPath = aStarSearch(startTri, goalTri, centers, delaunay, legalTriangles, getEdgeCostFn, goal);
  if (aStarPath.length === 0) {
    if (debug) {
      console.log('PathPlanner debug: aStar failed', {
        startTri,
        goalTri,
        centersStart: centers[startTri],
        centersGoal: centers[goalTri],
        legalTriangleCount: legalTriangles.size
      });
    }
    return { delaunay, path: [], legalTriangles, points };
  }

  const fullPath = [start, ...aStarPath, goal];
  const prunedPath = prunePath(fullPath, getLineCostFn, getEdgeCostFn);
  const smoothedPath = smoothPath(prunedPath, obstacles, motionProfile, dimensions);

  if (!isPathSafe(smoothedPath, obstacles)) {
    return { delaunay, path: prunedPath, legalTriangles, points };
  }

  return { delaunay, path: smoothedPath, legalTriangles, points };
};
