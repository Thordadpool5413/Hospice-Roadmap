import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      {...sceneTransitions.fadeBlur}
    >
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-16 mb-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(99,200,255,0.2)]"
        >
          <div className="w-8 h-8 rounded-full border-[3px] border-white" />
        </motion.div>
        
        <motion.h1 
          className="text-5xl font-display font-semibold tracking-tight text-text-primary mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Hospice Roadmap
        </motion.h1>

        <motion.p
          className="text-2xl text-primary font-medium"
          initial={{ y: 10, opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { y: 0, opacity: 1, filter: 'blur(0px)' } : { y: 10, opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}
        >
          Guidance for every moment
        </motion.p>
      </div>
    </motion.div>
  );
}
