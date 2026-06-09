import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const aiText = "I can help with that. First, let's assess the pain level. Has there been any change in medication recently?";
  const aiWords = aiText.split(" ");

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full"
      {...sceneTransitions.slideLeft}
    >
      <div className="w-[80%] max-w-6xl flex items-center gap-16">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className="text-5xl font-display font-medium text-text-primary leading-tight mb-4">
              AI guidance,<br/>always there
            </h2>
            <p className="text-xl text-text-secondary">
              Ragna AI Companion
            </p>
          </motion.div>
        </div>

        <div className="w-[380px] h-[780px] bg-bg-deep rounded-[3rem] border-8 border-bg-card shadow-2xl relative overflow-hidden flex flex-col shrink-0">
          <div className="h-20 bg-bg-panel flex items-center justify-between px-6 shrink-0 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center relative">
                <span className="text-bg-deep font-bold font-display">R</span>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-ragna border-2 border-bg-panel" />
              </div>
              <span className="font-semibold text-lg">Ragna</span>
            </div>
          </div>
          
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
            {/* User message */}
            <motion.div 
              className="self-end bg-primary/20 text-text-primary px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%]"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
            >
              How can I manage his pain at home?
            </motion.div>

            {/* AI message */}
            <motion.div 
              className="self-start bg-bg-panel text-text-primary px-5 py-4 rounded-2xl rounded-tl-sm max-w-[90%] border border-white/5"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0 }}
            >
              <p className="leading-relaxed">
                {aiWords.map((word, i) => (
                  <motion.span
                    key={i}
                    className="inline-block mr-1"
                    initial={{ opacity: 0 }}
                    animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.1 }}
                  >
                    {word}
                  </motion.span>
                ))}
                {phase >= 2 && phase < 3 && (
                  <motion.span 
                    className="inline-block w-2 h-4 bg-primary/50 ml-1 translate-y-1"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  />
                )}
              </p>
            </motion.div>

            {/* Suggestions */}
            <div className="mt-auto flex flex-col gap-2">
              <motion.div
                className="bg-bg-panel/50 border border-primary/20 text-primary px-4 py-2.5 rounded-xl text-sm font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4 }}
              >
                Log a pain symptom
              </motion.div>
              <motion.div
                className="bg-bg-panel/50 border border-white/10 text-text-secondary px-4 py-2.5 rounded-xl text-sm font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Review medication schedule
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
