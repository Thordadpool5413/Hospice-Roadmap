import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const searchText = "difficulty breathing";

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full"
      {...sceneTransitions.slideUp}
    >
      <div className="w-[80%] max-w-6xl flex items-center gap-16">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className="text-5xl font-display font-medium text-text-primary leading-tight mb-4">
              Guidance for every difficult moment
            </h2>
            <p className="text-xl text-text-secondary">
              Situation Finder
            </p>
          </motion.div>
        </div>

        <div className="w-[380px] h-[780px] bg-bg-deep rounded-[3rem] border-8 border-bg-card shadow-2xl relative overflow-hidden flex flex-col shrink-0 px-6 pt-12 pb-6">
          
          {/* Search bar */}
          <div className="h-14 bg-bg-panel rounded-2xl border border-white/10 flex items-center px-4 shadow-sm relative z-20">
            <svg className="w-5 h-5 text-text-muted mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-text-primary flex">
              {searchText.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {char}
                </motion.span>
              ))}
              <motion.span 
                className="w-0.5 h-5 bg-primary ml-1"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            </span>
          </div>

          {/* Categories Grid (Fades out when searching) */}
          <motion.div 
            className="grid grid-cols-2 gap-3 mt-8 absolute w-[calc(100%-3rem)]"
            initial={{ opacity: 1, y: 0 }}
            animate={phase >= 2 ? { opacity: 0, y: -20, pointerEvents: 'none' } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {['Pain', 'Breathing', 'Medication', 'Comfort', 'Family', 'Emergency'].map((cat, i) => (
              <div key={i} className="bg-surface-elevated/50 border border-white/5 rounded-xl h-20 p-3 flex flex-col justify-end">
                <span className="text-sm font-medium">{cat}</span>
              </div>
            ))}
          </motion.div>

          {/* Search Result */}
          <motion.div
            className="mt-8 relative z-10"
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring', bounce: 0.2 }}
          >
            <div className="bg-bg-panel rounded-2xl border border-accent-amber/30 p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent-amber" />
              <div className="flex gap-2 items-center mb-2">
                <span className="px-2 py-0.5 rounded-full bg-accent-amber/20 text-accent-amber text-xs font-bold uppercase">Urgent</span>
                <span className="text-xs text-text-muted">Guidance</span>
              </div>
              <h3 className="text-lg font-semibold mb-3">Managing Shortness of Breath</h3>
              
              <motion.div 
                className="text-sm text-text-secondary space-y-2 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p>1. Elevate the head of the bed or use pillows to sit up.</p>
                <p>2. Ensure good air circulation (open a window or use a fan).</p>
                <p>3. If prescribed, administer oxygen or comfort medication.</p>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
