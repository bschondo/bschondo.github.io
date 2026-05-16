import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Play, RotateCcw, MapPin, MousePointer2, Settings, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Delaunay } from 'd3-delaunay';

interface Point {
  x: number;
  y: number;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MotionProfile {
  minSpeed: number;
  maxSpeed: number;
  minSpeedDistance: number;
  maxSpeedDistance: number;
  gridResolution: number;
  maxCurveAngle: number;
}

export default function PathPlanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [start, setStart] = useState<Point>({ x: 50, y: 50 });
  const [goal, setGoal] = useState<Point>({ x: 350, y: 350 });
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    { id: '1', x: 150, y: 100, width: 100, height: 150 },
    { id: '2', x: 50, y: 250, width: 80, height: 80 },
  ]);

  const [motionProfile, setMotionProfile] = useState<MotionProfile>({
    minSpeed: 1,
    maxSpeed: 10,
    minSpeedDistance: 10,
    maxSpeedDistance: 80,
    gridResolution: 50,
    maxCurveAngle: 45,
  });
  
  const [dragState, setDragState] = useState<{
    type: 'start' | 'goal' | 'move-obs' | 'create-obs' | 'resize-obs' | null;
    id?: string;
    origin?: Point;
    currentPoint?: Point;
  }>({ type: null });

  const [showGraph, setShowGraph] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Update dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 400 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getPoint = (e: React.PointerEvent | PointerEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, dimensions.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, dimensions.height))
    };
  };

  const handleDelete = useCallback((id: string) => {
    setObstacles(prev => prev.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
    setShowGraph(false);
  }, [selectedId]);

  const onPointerDown = (e: React.PointerEvent) => {
    const point = getPoint(e);
    
    // Check for double tap (mobile)
    const now = Date.now();
    const isDoubleTap = now - lastTap < 300;
    setLastTap(now);

    // Right click or double tap to delete
    if (e.button === 2 || isDoubleTap) {
      const hit = obstacles.find(o => 
        point.x >= o.x && point.x <= o.x + o.width &&
        point.y >= o.y && point.y <= o.y + o.height
      );
      if (hit) {
        handleDelete(hit.id);
        return;
      }
    }

    if (e.button !== 0 && !isDoubleTap) return; // Only L-click (or first tap) for movement/creation

    // Reset search when interacting
    setShowGraph(false);

    // Check hit targets
    const distToStart = Math.hypot(start.x - point.x, start.y - point.y);
    const distToGoal = Math.hypot(goal.x - point.x, goal.y - point.y);

    if (distToStart < 25) {
      setDragState({ type: 'start' });
      setSelectedId(null);
    } else if (distToGoal < 25) {
      setDragState({ type: 'goal' });
      setSelectedId(null);
    } else {
      // Check for resize handle first (on top)
      const resizeHit = obstacles.find(o => 
        point.x >= o.x + o.width - 25 && point.x <= o.x + o.width + 5 &&
        point.y >= o.y + o.height - 25 && point.y <= o.y + o.height + 5
      );

      if (resizeHit) {
        setDragState({ type: 'resize-obs', id: resizeHit.id });
        setSelectedId(resizeHit.id);
        return;
      }

      const hitObs = [...obstacles].reverse().find(o => 
        point.x >= o.x && point.x <= o.x + o.width &&
        point.y >= o.y && point.y <= o.y + o.height
      );

      if (hitObs) {
        setDragState({ type: 'move-obs', id: hitObs.id, origin: { x: point.x - hitObs.x, y: point.y - hitObs.y } });
        setSelectedId(hitObs.id);
      } else {
        // Start creation
        const newId = Date.now().toString();
        setDragState({ type: 'create-obs', id: newId, origin: point, currentPoint: point });
        setSelectedId(newId);
      }
    }
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.type) return;
    const point = getPoint(e);

    if (dragState.type === 'start') setStart(point);
    else if (dragState.type === 'goal') setGoal(point);
    else if (dragState.type === 'move-obs' && dragState.id) {
      setObstacles(prev => prev.map(o => {
        if (o.id !== dragState.id) return o;
        const origin = dragState.origin || { x: 0, y: 0 };
        const x = Math.max(0, Math.min(point.x - origin.x, dimensions.width - o.width));
        const y = Math.max(0, Math.min(point.y - origin.y, dimensions.height - o.height));
        return { ...o, x, y };
      }));
    }
    else if (dragState.type === 'resize-obs' && dragState.id) {
      setObstacles(prev => prev.map(o => {
        if (o.id !== dragState.id) return o;
        const width = Math.max(20, Math.min(point.x - o.x, dimensions.width - o.x));
        const height = Math.max(20, Math.min(point.y - o.y, dimensions.height - o.y));
        return { ...o, width, height };
      }));
    }
    else if (dragState.type === 'create-obs' && dragState.id && dragState.origin) {
      const x = Math.min(point.x, dragState.origin.x);
      const y = Math.min(point.y, dragState.origin.y);
      const width = Math.abs(point.x - dragState.origin.x);
      const height = Math.abs(point.y - dragState.origin.y);
      
      setObstacles(prev => {
        const others = prev.filter(o => o.id !== dragState.id);
        if (width < 3 && height < 3) return others; // Don't add tiny dots
        return [...others, { id: dragState.id!, x, y, width, height }];
      });
    }
  }, [dragState, dimensions]);

  const onPointerUp = useCallback(() => {
    if (dragState.type === 'create-obs' && dragState.id) {
      setObstacles(prev => {
        const exists = prev.some(o => o.id === dragState.id);
        if (!exists) setSelectedId(null);
        return prev;
      });
    }
    setDragState({ type: null });
  }, [dragState]);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  // Pathfinding logic
  const result = useMemo(() => {
    if (!showGraph || dimensions.width === 0) return null;

    const points: [number, number][] = [
      [0, 0], [dimensions.width, 0], [0, dimensions.height], [dimensions.width, dimensions.height],
      [start.x, start.y], [goal.x, goal.y]
    ];

    // Add points for obstacles with padding to ensure we can navigate around them
    const PADDING = 2; 
    obstacles.forEach(obs => {
      // Four corners with slight padding outwards
      const corners = [
        [obs.x - PADDING, obs.y - PADDING],
        [obs.x + obs.width + PADDING, obs.y - PADDING],
        [obs.x - PADDING, obs.y + obs.height + PADDING],
        [obs.x + obs.width + PADDING, obs.y + obs.height + PADDING]
      ];
      
      corners.forEach(([px, py]) => {
        if (px >= 0 && px <= dimensions.width && py >= 0 && py <= dimensions.height) {
          points.push([px, py]);
        }
      });

      // Midpoints of edges
      points.push([obs.x + obs.width / 2, obs.y - PADDING]);
      points.push([obs.x + obs.width / 2, obs.y + obs.height + PADDING]);
      points.push([obs.x - PADDING, obs.y + obs.height / 2]);
      points.push([obs.x + obs.width + PADDING, obs.y + obs.height / 2]);
    });

    // Boundary points for stable triangulation at edges
    points.push([0, 0]);
    points.push([dimensions.width, 0]);
    points.push([0, dimensions.height]);
    points.push([dimensions.width, dimensions.height]);
    points.push([dimensions.width / 2, 0]);
    points.push([dimensions.width / 2, dimensions.height]);
    points.push([0, dimensions.height / 2]);
    points.push([dimensions.width, dimensions.height / 2]);

    // delaunay and triangulation setup
    const delaunay = Delaunay.from(points);
    
    // centroids and legality
    const centers: Point[] = [];
    const legalTriangles = new Set<number>();
    const numTriangles = delaunay.triangles.length / 3;

    // Helper to check if point is in triangle
    const isPointInTriangle = (px: number, py: number, tIdx: number) => {
      const pIdx0 = delaunay.triangles[tIdx * 3];
      const pIdx1 = delaunay.triangles[tIdx * 3 + 1];
      const pIdx2 = delaunay.triangles[tIdx * 3 + 2];
      const p0 = points[pIdx0];
      const p1 = points[pIdx1];
      const p2 = points[pIdx2];

      const area = 0.5 * (-p1[1] * p2[0] + p0[1] * (-p1[0] + p2[0]) + p0[0] * (p1[1] - p2[1]) + p1[0] * p2[1]);
      const s = 1 / (2 * area) * (p0[1] * p2[0] - p0[0] * p2[1] + (p2[1] - p0[1]) * px + (p0[0] - p2[0]) * py);
      const t = 1 / (2 * area) * (p0[0] * p1[1] - p0[1] * p1[0] + (p0[1] - p1[1]) * px + (p1[0] - p0[0]) * py);
      return s >= 0 && t >= 0 && (1 - s - t) >= 0;
    };

    for (let t = 0; t < numTriangles; t++) {
      let cx = 0, cy = 0;
      for (let i = 0; i < 3; i++) {
        const pIdx = delaunay.triangles[t * 3 + i];
        cx += points[pIdx][0];
        cy += points[pIdx][1];
      }
      const center = { x: cx / 3, y: cy / 3 };
      centers.push(center);

      // A triangle is legal if its center is not inside any obstacle
      const insideObs = obstacles.some(o => 
        center.x >= o.x && center.x <= o.x + o.width && 
        center.y >= o.y && center.y <= o.y + o.height
      );
      if (!insideObs) legalTriangles.add(t);
    }

    // Find triangles containing start and goal
    let startTri = -1;
    let goalTri = -1;

    for (let t = 0; t < numTriangles; t++) {
      if (startTri === -1 && isPointInTriangle(start.x, start.y, t)) startTri = t;
      if (goalTri === -1 && isPointInTriangle(goal.x, goal.y, t)) goalTri = t;
    }

    // Fallback: if not directly inside (e.g. on edge), find nearest legal triangle center
    if (startTri === -1 || !legalTriangles.has(startTri)) {
      let minDist = Infinity;
      legalTriangles.forEach(t => {
        const d = Math.hypot(centers[t].x - start.x, centers[t].y - start.y);
        if (d < minDist) {
          minDist = d;
          startTri = t;
        }
      });
    }
    if (goalTri === -1 || !legalTriangles.has(goalTri)) {
      let minDist = Infinity;
      legalTriangles.forEach(t => {
        const d = Math.hypot(centers[t].x - goal.x, centers[t].y - goal.y);
        if (d < minDist) {
          minDist = d;
          goalTri = t;
        }
      });
    }

    if (startTri === -1 || goalTri === -1) {
      return { delaunay, path: [], legalTriangles, points };
    }

    // A* Search with Distance Field Cost
    const dist = (p1: Point, p2: Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    
    // Calculate clearance for each triangle centroid
    const getClearance = (p: Point) => {
      let minClearance = Infinity;
      
      // Treat boundaries as obstacles
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

    // Cost function: time = distance / speed
    const getPointCost = (p: Point) => {
      const clearance = getClearance(p);
      if (clearance < 2) return 1000; // Large penalty for near collisions
      
      const { minSpeed, maxSpeed, minSpeedDistance, maxSpeedDistance } = motionProfile;
      
      let speed = maxSpeed;
      if (clearance <= minSpeedDistance) {
        speed = minSpeed;
      } else if (clearance < maxSpeedDistance) {
        // Linear interpolation of speed based on clearance
        const t = (clearance - minSpeedDistance) / (maxSpeedDistance - minSpeedDistance);
        speed = minSpeed + (maxSpeed - minSpeed) * t;
      }
      
      const travelTime = 1 / speed;
      return travelTime;
    };

    const getEdgeCost = (p1: Point, p2: Point) => {
      const d = dist(p1, p2);
      // Sample cost along the edge for precision
      const steps = 3;
      let totalTime = 0;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = p1.x + (p2.x - p1.x) * t;
        const py = p1.y + (p2.y - p1.y) * t;
        totalTime += getPointCost({ x: px, y: py });
      }
      return d * (totalTime / (steps + 1));
    };
    
    const openSet = [startTri];
    const cameFrom = new Map<number, number>();
    const gScore = new Map<number, number>();
    const fScore = new Map<number, number>();

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
          const tentativeGScore = (gScore.get(current) || 0) + getEdgeCost(centers[current], centers[neighbor]);
          
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

    const path: Point[] = [];
    if (endTri !== -1) {
      let curr = endTri;
      while (curr !== startTri && cameFrom.has(curr)) {
        path.push(centers[curr]);
        curr = cameFrom.get(curr)!;
      }
      path.push(centers[startTri]);
      path.reverse();
      
      const aStarPath = [start, ...path, goal];

      // Helper to check if a straight line is safe AND beneficial
      const getLineSegmentCost = (p1: Point, p2: Point) => {
        const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const steps = Math.max(2, Math.ceil(distance / 5));
        let totalTime = 0;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const px = p1.x + (p2.x - p1.x) * t;
            const py = p1.y + (p2.y - p1.y) * t;
            
            if (px <= 0 || px >= dimensions.width || py <= 0 || py >= dimensions.height) return Infinity;
            if (obstacles.some(o => px >= o.x - 1 && px <= o.x + o.width + 1 && py >= o.y - 1 && py <= o.y + o.height + 1)) {
                return Infinity;
            }
            totalTime += getPointCost({ x: px, y: py });
        }
        return distance * (totalTime / (steps + 1));
      };

      // Path Pruning (Shortcutting) with Cost Awareness
      let prunedPath = [aStarPath[0]];
      let currentIdx = 0;
      while (currentIdx < aStarPath.length - 1) {
        let furthestVisible = currentIdx + 1;
        
        // Find the furthest point we can skip to safely
        // Lenient threshold (1.2) helps reduce zig-zags from centroid paths
        for (let j = aStarPath.length - 1; j > currentIdx + 1; j--) {
          const directCost = getLineSegmentCost(aStarPath[currentIdx], aStarPath[j]);
          
          if (directCost !== Infinity) {
            let meshCost = 0;
            for (let k = currentIdx; k < j; k++) {
                meshCost += getEdgeCost(aStarPath[k], aStarPath[k+1]);
            }

            // More aggressive shortcutting to remove mesh zig-zags
            if (directCost < meshCost * 1.25) { 
                furthestVisible = j;
                break;
            }
          }
        }
        prunedPath.push(aStarPath[furthestVisible]);
        currentIdx = furthestVisible;
      }

      // Smoothing: Catmull-Rom spline approximation
      if (prunedPath.length < 3) return { delaunay, path: prunedPath, legalTriangles, points };

      const smoothed: Point[] = [];
      const resolution = 20; // Increased resolution
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

            // Strict inside check
            const inside = obstacles.some(o => x >= o.x && x <= o.x + o.width && y >= o.y && y <= o.y + o.height);
            if (inside) {
              x = linearX;
              y = linearY;
            }

            smoothed.push({ x, y });
        }
      }
      smoothed.push(goal);

      // Final Intersection Check: Verify the smoothed path is actually safe
      // Check every segment at higher resolution than the points themselves
      const isPathSafe = (pList: Point[]) => {
        for (let i = 0; i < pList.length - 1; i++) {
          const p1 = pList[i];
          const p2 = pList[i + 1];
          const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          const steps = Math.ceil(distance / 2); // 2px granularity
          for (let s = 1; s < steps; s++) {
            const t = s / steps;
            const px = p1.x + (p2.x - p1.x) * t;
            const py = p1.y + (p2.y - p1.y) * t;
            if (obstacles.some(o => px >= o.x && px <= o.x + o.width && py >= o.y && py <= o.y + o.height)) {
              return false;
            }
          }
        }
        return true;
      };

      if (!isPathSafe(smoothed)) {
        console.warn("Catmull-Rom smoothing caused collision. Falling back to linear pruned path.");
        return { delaunay, path: prunedPath, legalTriangles, points };
      }

      return { delaunay, path: smoothed, legalTriangles, points };
    }

    return { delaunay, path: [], legalTriangles, points };
  }, [showGraph, obstacles, start, goal, dimensions, motionProfile]);

  return (
    <div className="bg-brand-secondary/30 border border-brand-secondary p-6 rounded-2xl my-8 select-none touch-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
            Path Planning Sandbox
          </h4>
        </div>
        <div className="flex gap-2">
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-all ${
              showSettings ? 'bg-brand-primary text-brand-bg hover:bg-brand-primary/90' : 'bg-brand-secondary/50 text-brand-text hover:bg-brand-secondary'
            }`}
            title="Tuning Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => {
              setObstacles([]);
              setShowGraph(false);
            }}
            className="p-2 bg-brand-secondary/50 text-brand-text rounded-lg hover:bg-brand-secondary transition-all"
            title="Clear All"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => setShowGraph(!showGraph)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              showGraph ? 'bg-brand-accent text-white hover:bg-brand-accent/90' : 'bg-brand-primary text-brand-bg hover:bg-brand-primary/90'
            }`}
          >
            <Play size={16} fill="currentColor" />
            {showGraph ? 'Reset' : 'Execute Search'}
          </button>
        </div>
      </div>

      {/* Tuning Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6 bg-brand-secondary/20 rounded-xl border border-brand-secondary/30"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TuningSlider 
                label="Min Speed" 
                value={motionProfile.minSpeed} 
                min={0.1} max={5} step={0.1}
                onChange={(v) => setMotionProfile(p => ({ ...p, minSpeed: v }))}
              />
              <TuningSlider 
                label="Max Speed" 
                value={motionProfile.maxSpeed} 
                min={5} max={20} step={1}
                onChange={(v) => setMotionProfile(p => ({ ...p, maxSpeed: v }))}
              />
              <TuningSlider 
                label="Min Distance" 
                value={motionProfile.minSpeedDistance} 
                min={0} max={40} step={1}
                onChange={(v) => setMotionProfile(p => ({ ...p, minSpeedDistance: v }))}
              />
              <TuningSlider 
                label="Max Distance" 
                value={motionProfile.maxSpeedDistance} 
                min={40} max={150} step={5}
                onChange={(v) => setMotionProfile(p => ({ ...p, maxSpeedDistance: v }))}
              />
              <TuningSlider 
                label="Max Curve Angle" 
                value={motionProfile.maxCurveAngle} 
                min={0} max={90} step={5}
                onChange={(v) => setMotionProfile(p => ({ ...p, maxCurveAngle: v }))}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={containerRef}
        onPointerDown={onPointerDown}
        onContextMenu={(e) => e.preventDefault()}
        className="relative bg-brand-bg border border-brand-secondary/50 rounded-xl overflow-hidden mb-4 cursor-crosshair h-[400px]"
      >
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />

        {/* Triangulation Layer */}
        <AnimatePresence>
          {showGraph && result && (
            <motion.svg 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <path
                d={Array.from(result.legalTriangles).map(tIdx => {
                  const p0 = result.points[result.delaunay.triangles[tIdx * 3]];
                  const p1 = result.points[result.delaunay.triangles[tIdx * 3 + 1]];
                  const p2 = result.points[result.delaunay.triangles[tIdx * 3 + 2]];
                  return `M ${p0[0]},${p0[1]} L ${p1[0]},${p1[1]} L ${p2[0]},${p2[1]} Z`;
                }).join(' ')}
                fill="none"
                stroke="var(--color-brand-primary)"
                strokeWidth="0.5"
                className="opacity-20"
              />
              
              {/* Path Line */}
              {result.path.length > 1 && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  d={`M ${result.path.map(p => `${p.x},${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="var(--color-brand-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                />
              )}
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div
            key={obs.id}
            style={{ left: obs.x, top: obs.y, width: obs.width, height: obs.height }}
            className={`absolute border-2 transition-colors ${
              dragState.id === obs.id || selectedId === obs.id
                ? 'bg-brand-primary/20 border-brand-primary z-20 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                : 'bg-brand-secondary/40 border-brand-secondary/60 z-10'
            }`}
          >
            {selectedId === obs.id && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-brand-primary flex items-center justify-center rounded-tl cursor-nwse-resize z-30">
                <Maximize2 size={12} className="text-brand-bg" />
              </div>
            )}
            <div className="absolute top-1 left-2 text-[10px] uppercase font-bold text-white/10 select-none">
              OBS_{obs.id.slice(-2)}
            </div>
          </div>
        ))}

        {/* Start Point */}
        <motion.div
          style={{ left: start.x, top: start.y }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing z-30 pointer-events-none"
        >
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          <MapPin size={24} className="text-green-500 fill-green-500/20" />
          <span className="absolute -top-6 text-[10px] font-bold text-green-500 uppercase">Start</span>
        </motion.div>

        {/* Goal Point */}
        <motion.div
          style={{ left: goal.x, top: goal.y }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing z-30 pointer-events-none"
        >
          <div className="absolute inset-0 bg-brand-accent/20 rounded-full animate-ping" />
          <MapPin size={24} className="text-brand-accent fill-brand-accent/20" />
          <span className="absolute -top-6 text-[10px] font-bold text-brand-accent uppercase">Goal</span>
        </motion.div>
      </div>

      <div className="flex flex-wrap items-center gap-6 py-3 px-4 bg-brand-secondary/10 rounded-xl text-xs text-brand-text/50 border border-brand-secondary/20">
        <div className="flex items-center gap-2">
          <MousePointer2 size={14} className="text-brand-primary" />
          <span><b>L-Click + Drag:</b> Create/Move/Resize</span>
        </div>
        <div className="flex items-center gap-2">
          <Maximize2 size={14} className="text-brand-primary" />
          <span>Corner Handle to Resize</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-red-500/50 rounded flex items-center justify-center text-[8px] text-red-500 font-bold">R</div>
          <span><b>R-Click:</b> Delete</span>
        </div>
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-brand-accent" />
          <span><b>Mobile:</b> Double-Tap: Delete</span>
        </div>
      </div>
      
    </div>
  );
}

function TuningSlider({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-brand-text/60">
        <span>{label}</span>
        <span className="text-brand-primary">{value}</span>
      </div>
      <input 
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-brand-secondary rounded-lg appearance-none cursor-pointer accent-brand-primary border-none"
      />
    </div>
  );
}
