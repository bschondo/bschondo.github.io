"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Delaunay } from 'd3-delaunay';

export default function PathDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<number[][]>([]);
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPoints([...points, [e.clientX - rect.left, e.clientY - rect.top]]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (points.length >= 3) {
      const flatPoints = points.flat();
      const delaunay = Delaunay.from(flatPoints);
      const { triangles } = delaunay;

      // Draw Mesh
      ctx.strokeStyle = '#27272a';
      for (let i = 0; i < triangles.length; i += 3) {
        ctx.beginPath();
        ctx.moveTo(flatPoints[2 * triangles[i]], flatPoints[2 * triangles[i] + 1]);
        ctx.lineTo(flatPoints[2 * triangles[i + 1]], flatPoints[2 * triangles[i + 1] + 1]);
        ctx.lineTo(flatPoints[2 * triangles[i + 2]], flatPoints[2 * triangles[i + 2] + 1]);
        ctx.closePath();
        ctx.stroke();
        
        // Draw Centroids
        const cx = (flatPoints[2 * triangles[i]] + flatPoints[2 * triangles[i+1]] + flatPoints[2 * triangles[i+2]]) / 3;
        const cy = (flatPoints[2 * triangles[i]+1] + flatPoints[2 * triangles[i+1]+1] + flatPoints[2 * triangles[i+2]+1]) / 3;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Input Points
    ctx.fillStyle = '#10b981';
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points]);

  return (
    <div className="bg-surface p-6 rounded-xl border border-border flex flex-col items-center">
      <div className="mb-4 text-center font-mono">
        <h3 className="text-primary font-bold">SPATIAL_DECOMPOSITION_V1</h3>
        <p className="text-xs text-slate-500">Add points to generate mesh</p>
      </div>
      <canvas 
        ref={canvasRef} width={600} height={400} 
        onClick={handleCanvasClick}
        className="bg-background rounded border border-border cursor-crosshair"
      />
      <button onClick={() => setPoints([])} className="mt-4 text-xs font-mono text-slate-600 hover:text-red-500">
        [ RESET_GRAPH ]
      </button>
    </div>
  );
}