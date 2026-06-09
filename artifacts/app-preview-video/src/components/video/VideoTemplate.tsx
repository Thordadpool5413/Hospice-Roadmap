import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS: Record<string, number> = {
  intro: 3000,
  ragna: 8000,
  symptom: 7000,
  situation: 7000,
  outro: 3000
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1,
  ragna: Scene2,
  symptom: Scene3,
  situation: Scene4,
  outro: Scene5,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 1.0;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <>
      <div className="w-full h-screen overflow-hidden relative bg-bg-deep font-body">
        {/* Ambient background that persists */}
        <div className="absolute inset-0 z-0 opacity-40">
          <motion.div
            className="absolute w-[80vw] h-[80vw] rounded-full blur-[100px] top-[-20%] left-[-20%]"
            style={{ background: 'radial-gradient(circle, var(--color-bg-card), transparent)' }}
            animate={{ x: [0, '20%', 0], y: [0, '10%', 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[60vw] h-[60vw] rounded-full blur-[80px] bottom-[-10%] right-[-10%]"
            style={{ background: 'radial-gradient(circle, var(--color-surface-elevated), transparent)' }}
            animate={{ x: [0, '-15%', 0], y: [0, '-20%', 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Persistent midground accent that shifts with scene */}
        <motion.div
          className="absolute w-[2px] top-0 bottom-0 opacity-30"
          style={{ background: 'var(--color-primary)' }}
          animate={{ left: [`${8 + sceneIndex * 15}%`] }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />

        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/composite_audio.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </>
  );
}
