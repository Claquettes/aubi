import { create } from 'zustand';
import type { Track } from '@/types/api';

export type RepeatMode = 'none' | 'one' | 'all';

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;
  currentTimeMs: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  source: string;
  fullPlayerOpen: boolean;
  queueOpen: boolean;
  setSource: (source: string) => void;
  setVolume: (v: number) => void;
  setProgress: (p: number, currentTimeMs: number) => void;
  togglePlay: () => void;
  playTrack: (track: Track, queue?: Track[], index?: number) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  seek: (ratio: number) => void;
  seekTo: number | null;
  clearSeek: () => void;
  setFullPlayerOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  addToQueue: (tracks: Track | Track[]) => void;
  moveInQueue: (from: number, to: number) => void;
  removeFromQueue: (index: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  progress: 0,
  currentTimeMs: 0,
  volume: 0.9,
  isShuffle: false,
  repeatMode: 'none',
  source: 'library',
  seekTo: null,
  fullPlayerOpen: false,
  queueOpen: false,

  setSource: (source) => set({ source }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress, currentTimeMs) => set({ progress, currentTimeMs }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  playTrack: (track, queue, index = 0) => {
    const q = queue?.length ? queue : [track];
    const i = Math.max(0, Math.min(index, q.length - 1));
    set({
      currentTrack: q[i],
      queue: q,
      queueIndex: i,
      isPlaying: true,
      progress: 0,
      currentTimeMs: 0,
    });
  },

  next: () => {
    const { queue, queueIndex, repeatMode } = get();
    if (!queue.length) return;
    if (repeatMode === 'one') return;
    let i = queueIndex + 1;
    if (i >= queue.length) {
      if (repeatMode === 'all') i = 0;
      else {
        set({ isPlaying: false });
        return;
      }
    }
    set({
      queueIndex: i,
      currentTrack: queue[i],
      progress: 0,
      currentTimeMs: 0,
    });
  },

  prev: () => {
    const { queue, queueIndex, progress, currentTimeMs } = get();
    if (!queue.length) return;
    if (progress > 0.03 || currentTimeMs > 3000) {
      set({ progress: 0, currentTimeMs: 0 });
      return;
    }
    const i = Math.max(0, queueIndex - 1);
    set({
      queueIndex: i,
      currentTrack: queue[i],
      progress: 0,
      currentTimeMs: 0,
    });
  },

  toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),

  cycleRepeat: () =>
    set((s) => ({
      repeatMode:
        s.repeatMode === 'none'
          ? 'all'
          : s.repeatMode === 'all'
            ? 'one'
            : 'none',
    })),

  seek: (ratio) => {
    const t = get().currentTrack;
    if (!t) return;
    const ms = Math.floor(ratio * t.durationMs);
    set({ progress: ratio, currentTimeMs: ms, seekTo: ratio });
  },

  clearSeek: () => set({ seekTo: null }),

  setFullPlayerOpen: (fullPlayerOpen) => set({ fullPlayerOpen }),
  setQueueOpen: (queueOpen) => set({ queueOpen }),

  addToQueue: (tracks) => {
    const add = Array.isArray(tracks) ? tracks : [tracks];
    if (!add.length) return;
    const { queue, currentTrack } = get();
    if (!currentTrack) {
      // Rien en lecture : on démarre le premier titre ajouté.
      set({
        currentTrack: add[0],
        queue: add,
        queueIndex: 0,
        isPlaying: true,
        progress: 0,
        currentTimeMs: 0,
      });
    } else {
      set({ queue: [...queue, ...add] });
    }
  },

  moveInQueue: (from, to) => {
    const { queue, queueIndex } = get();
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= queue.length ||
      to >= queue.length
    )
      return;
    const q = [...queue];
    const [moved] = q.splice(from, 1);
    q.splice(to, 0, moved);
    let idx = queueIndex;
    if (from === queueIndex) idx = to;
    else if (from < queueIndex && to >= queueIndex) idx = queueIndex - 1;
    else if (from > queueIndex && to <= queueIndex) idx = queueIndex + 1;
    set({ queue: q, queueIndex: idx });
  },

  removeFromQueue: (index) => {
    const { queue, queueIndex } = get();
    if (index < 0 || index >= queue.length || index === queueIndex) return;
    const q = queue.filter((_, i) => i !== index);
    const idx = index < queueIndex ? queueIndex - 1 : queueIndex;
    set({ queue: q, queueIndex: idx });
  },
}));
