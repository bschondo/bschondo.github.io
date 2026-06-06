import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Play, RotateCcw, MapPin, MousePointer2, Settings, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MotionProfile } from './types/MotionProfile';
import { NavigationGraph } from './NavigationGraph';
import { newClampedPoint, Point } from './types/Point';
import { Obstacle } from './types/Obstacle';

export default function InteractiveAmazonApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [start, setStart] = useState<Point>({ x: 50, y: 50 });
  const [goal, setGoal] = useState<Point>({ x: 350, y: 350 });
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    new Obstacle('1', 100, 0, 50, 200),
    new Obstacle('2', 250, 150, 50, 250)
  ]);

  const [motionProfile, setMotionProfile] = useState<MotionProfile>({
    minSpeed: 1,
    maxSpeed: 10,
    minSpeedDistance: 10,
    maxSpeedDistance: 80,
    gridResolution: 50
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
    return newClampedPoint(e.clientX - rect.left, e.clientY - rect.top, dimensions);
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
        setObstacles(prev => [...prev, new Obstacle(newId, point.x, point.y, 20, 20)]);
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
        const newX = Math.max(0, Math.min(point.x - origin.x, dimensions.width - o.width));
        const newY = Math.max(0, Math.min(point.y - origin.y, dimensions.height - o.height));
        return o.updatePosition({ x: newX, y: newY });
      }));
    }
    else if (dragState.type === 'resize-obs' && dragState.id) {
      setObstacles(prev => prev.map(o => {
        if (o.id !== dragState.id) return o;
        return o.updateSize(point.x - o.x, point.y - o.y);
      }));
    }
    else if (dragState.type === 'create-obs' && dragState.id && dragState.origin) {
      const clamped = newClampedPoint(point.x, point.y, dimensions);
      const x = Math.min(dragState.origin.x, clamped.x);
      const y = Math.min(dragState.origin.y, clamped.y);
      const width = Math.abs(clamped.x - dragState.origin.x);
      const height = Math.abs(clamped.y - dragState.origin.y);

      setObstacles(prev => prev.map(o => {
        if (o.id !== dragState.id) return o;
        return new Obstacle(dragState.id!, x, y, width, height);
      }));
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

  const navigationGraph = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return null;
    return new NavigationGraph(obstacles, dimensions);
  }, [obstacles, dimensions]);

  // Pathfinding logic
  const result = useMemo(() => {
    if (!showGraph || !navigationGraph) return null;
    return navigationGraph.findPath(start, goal, motionProfile);
  }, [showGraph, navigationGraph, start, goal, motionProfile]);

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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              showSettings ? 'bg-brand-primary text-brand-bg hover:bg-brand-primary/90' : 'bg-brand-secondary/50 text-brand-text hover:bg-brand-secondary'
            }`}
            title="Tuning Settings"
          >
            <Settings size={18} />
            {'Settings'}
          </button>
          <button
            onClick={() => {
              setObstacles([]);
              setShowGraph(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all bg-brand-accent text-brand-bg hover:bg-brand-accent/90"
            title="Clear All"
          >
            <RotateCcw size={18} />
            Reset
          </button>
          <button
            onClick={() => setShowGraph(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all bg-brand-primary text-brand-bg hover:bg-brand-primary/90"
          >
            <Play size={16} fill="currentColor" />
            Execute Search
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
                onChange={(v) => setMotionProfile((p: any) => ({ ...p, minSpeed: v }))}
              />
              <TuningSlider 
                label="Max Speed" 
                value={motionProfile.maxSpeed} 
                min={5} max={20} step={1}
                onChange={(v) => setMotionProfile((p: any) => ({ ...p, maxSpeed: v }))}
              />
              <TuningSlider 
                label="Min Distance" 
                value={motionProfile.minSpeedDistance} 
                min={0} max={40} step={1}
                onChange={(v) => setMotionProfile((p: any) => ({ ...p, minSpeedDistance: v }))}
              />
              <TuningSlider 
                label="Max Distance" 
                value={motionProfile.maxSpeedDistance} 
                min={40} max={150} step={5}
                onChange={(v) => setMotionProfile((p: any) => ({ ...p, maxSpeedDistance: v }))}
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
        {/* No Path Banner*/}
        {showGraph && result && (!result.curvePath || result.curvePath.length === 0) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-md shadow-lg pointer-events-none animate-in fade-in zoom-in duration-200">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider select-none">
              No Valid Path
            </span>
          </div>
        )}

        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />

        {/* Triangulation Layer */}
        <AnimatePresence>
          {showGraph && result && navigationGraph && (
            <motion.svg 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <path
                d={navigationGraph.triangles.map(tri => {
                  const [p0, p1, p2] = tri.vertices();
                  return `M ${p0.x},${p0.y} L ${p1.x},${p1.y} L ${p2.x},${p2.y} Z`;
                }).join(' ')}
                fill="none"
                stroke="var(--color-brand-primary)"
                strokeWidth="0.5"
                className="opacity-20"
              />

              {/* Bezier Path */}
              {result.curvePath.length > 0 && (
                <>
                  {result.curvePath.map((segment, index) => (
                    <motion.path
                      key={`bezier-${index}`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      d={`M ${segment.start.x},${segment.start.y} C ${segment.control1.x},${segment.control1.y} ${segment.control2.x},${segment.control2.y} ${segment.end.x},${segment.end.y}`}
                      fill="none"
                      stroke="var(--color-brand-primary)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                    />
                  ))}
                </>
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
