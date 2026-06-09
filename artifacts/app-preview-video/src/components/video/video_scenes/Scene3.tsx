import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const symptoms = [
    { name: 'Pain', value: '70%', color: 'var(--color-accent-symptom)' },
    { name: 'Breathlessness', value: '40%', color: 'var(--color-primary-light)' },
    { name: 'Nausea', value: '25%', color: 'var(--color-text-secondary)' },
    { name: 'Agitation', value: '55%', color: 'var(--color-accent-amber)' },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full"
      {...sceneTransitions.zoomThrough}
    >
      <div className="w-[80%] max-w-6xl flex items-center gap-16 flex-row-reverse">
        <div className="flex-1 pl-12">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className="text-5xl font-display font-medium text-text-primary leading-tight mb-4">
              Track symptoms. Spot trends. Stay ahead.
            </h2>
            <p className="text-xl text-text-secondary">
              Symptom Tracker
            </p>
          </motion.div>
        </div>

        <div className="w-[380px] h-[780px] bg-bg-deep rounded-[3rem] border-8 border-bg-card shadow-2xl relative overflow-hidden flex flex-col shrink-0">
          <div className="p-8 pb-4">
            <h3 className="text-2xl font-display font-semibold mb-6">Today's Log</h3>
            
            <div className="flex flex-col gap-6">
              {symptoms.map((sym, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{sym.name}</span>
                  </div>
                  <div className="h-3 bg-bg-panel rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ backgroundColor: sym.color }}
                      initial={{ width: '0%' }}
                      animate={phase >= 2 ? { width: sym.value } : { width: '0%' }}
                      transition={{ duration: 1.2, delay: i * 0.15, type: 'spring', bounce: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-6 bg-bg-panel flex-1 rounded-t-3xl border-t border-white/5">
            <h4 className="text-sm text-text-secondary font-medium mb-6 uppercase tracking-wider">7-Day Trends</h4>
            
            <div className="flex flex-col gap-4">
              {[1, 2].map((idx) => (
                <div key={idx} className="bg-bg-card rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between text-sm mb-3">
                    <span>{idx === 1 ? 'Pain' : 'Agitation'}</span>
                    <span className={idx === 1 ? 'text-accent-symptom' : 'text-accent-amber'}>Increasing</span>
                  </div>
                  <div className="h-10 flex items-end gap-1.5">
                    {[30, 40, 35, 50, 60, 55, 75].map((val, barIdx) => (
                      <motion.div
                        key={barIdx}
                        className="flex-1 rounded-t-sm"
                        style={{ backgroundColor: idx === 1 ? 'var(--color-accent-symptom)' : 'var(--color-accent-amber)' }}
                        initial={{ height: '0%' }}
                        animate={phase >= 3 ? { height: `${val}%` } : { height: '0%' }}
                        transition={{ duration: 0.6, delay: barIdx * 0.05 + (idx * 0.2) }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
