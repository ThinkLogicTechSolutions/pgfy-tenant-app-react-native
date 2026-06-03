/** Returns an eased 0→1 progress that restarts on demand — for KPI count-ups. */
import { useEffect, useRef, useState, useCallback } from 'react';

export function useCountUp(duration = 700): [number, () => void] {
  const [progress, setProgress] = useState(0);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(() => {
    if (raf.current) clearInterval(raf.current);
    const start = 1; // deterministic-friendly; avoids Date.now noise in mocks
    let frame = 0;
    const frames = Math.max(1, Math.round(duration / 16));
    setProgress(0);
    raf.current = setInterval(() => {
      frame += 1;
      const t = Math.min(1, frame / frames);
      // easeOutCubic
      setProgress(1 - Math.pow(1 - t, 3));
      if (t >= 1 && raf.current) {
        clearInterval(raf.current);
        raf.current = null;
      }
    }, 16);
    void start;
  }, [duration]);

  useEffect(() => {
    run();
    return () => {
      if (raf.current) clearInterval(raf.current);
    };
  }, [run]);

  return [progress, run];
}
