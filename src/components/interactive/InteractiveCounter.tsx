import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

export default function InteractiveCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="bg-brand-secondary/30 border border-brand-secondary p-6 rounded-xl my-8">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-primary mb-4">
        Interactive Module: Logic Sandbox
      </h4>
      <div className="flex items-center justify-between">
        <div className="text-4xl font-mono font-bold text-brand-text">
          {count.toString().padStart(2, '0')}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCount(prev => prev + 1)}
            className="flex items-center gap-2 bg-brand-primary text-brand-bg px-4 py-2 rounded-lg font-bold hover:bg-brand-primary/90 transition-colors"
          >
            <Play size={18} fill="currentColor" />
            Increment
          </button>
          <button
            onClick={() => setCount(0)}
            className="p-2 border border-brand-secondary rounded-lg hover:bg-brand-secondary/50 transition-colors text-brand-text/60"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
      <p className="mt-4 text-xs text-brand-text/40 italic">
        This is a live React component embedded within the MDX layer. It maintains its own state and responds to interactions independently of the main page flow.
      </p>
    </div>
  );
}
