import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from './usePlayerStore';
import { apiUrl } from '@/api/client';

export function useAudioEngine() {
  const howlRef = useRef<Howl | null>(null);
  const currentIdRef = useRef<string | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const setProgress = usePlayerStore((s) => s.setProgress);
  useEffect(() => {
    if (!currentTrack) {
      howlRef.current?.unload();
      howlRef.current = null;
      currentIdRef.current = null;
      return;
    }
    if (currentIdRef.current === currentTrack.id && howlRef.current) {
      return;
    }
    howlRef.current?.unload();
    currentIdRef.current = currentTrack.id;
    const url = apiUrl(`/api/v1/stream/${currentTrack.id}`);
    const howl = new Howl({
      src: [url],
      html5: true,
      volume,
      onloaderror: () => {
        /* offline / CORS */
      },
      onend: () => {
        usePlayerStore.getState().next();
      },
    });
    howlRef.current = howl;
    howl.volume(volume);
    howl.play();
  }, [currentTrack]);

  useEffect(() => {
    const h = howlRef.current;
    if (!h) return;
    h.volume(volume);
  }, [volume]);

  useEffect(() => {
    const h = howlRef.current;
    if (!h) return;
    if (isPlaying) {
      if (!h.playing()) h.play();
    } else {
      h.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const h = howlRef.current;
    if (!h || !currentTrack) return;
    let raf = 0;
    const tick = () => {
      if (h.playing() && h.duration()) {
        const pos = h.seek() as number;
        const d = h.duration();
        setProgress(pos / d, Math.floor(pos * 1000));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currentTrack, setProgress]);

  useEffect(() => {
    return () => {
      howlRef.current?.unload();
    };
  }, []);
}
