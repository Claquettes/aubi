import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from './usePlayerStore';
import { apiUrl } from '@/api/client';
import { statsApi } from '@/api/stats';
import {
  primeAudioPool,
  resumeAudioAnalyser,
  tapAudioElement,
} from './audioAnalyser';

/** Élément <audio> interne de Howler (mode html5), pour l'analyse spectrale. */
function howlNode(howl: Howl): HTMLMediaElement | null {
  const sounds = (howl as unknown as { _sounds?: { _node?: unknown }[] })
    ._sounds;
  const node = sounds?.[0]?._node;
  return node instanceof HTMLMediaElement ? node : null;
}

export function useAudioEngine() {
  const howlRef = useRef<Howl | null>(null);
  const currentIdRef = useRef<string | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const seekTo = usePlayerStore((s) => s.seekTo);
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
    primeAudioPool(url);
    const howl = new Howl({
      src: [url],
      html5: true,
      volume,
      onloaderror: () => {
        /* offline / CORS */
      },
      onplay: () => {
        tapAudioElement(howlNode(howl), url);
      },
      onend: () => {
        const st = usePlayerStore.getState();
        const ended = st.currentTrack;
        if (ended) {
          statsApi
            .play({
              trackId: ended.id,
              durationMs: ended.durationMs,
              completed: true,
              source: st.source,
            })
            .catch(() => {});
        }
        st.next();
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
      resumeAudioAnalyser();
    } else {
      h.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const h = howlRef.current;
    if (h && seekTo != null && h.duration()) {
      h.seek(seekTo * h.duration());
      usePlayerStore.getState().clearSeek();
    }
  }, [seekTo]);

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
