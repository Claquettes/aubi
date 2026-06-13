import { useEffect } from 'react';
import { apiUrl } from '@/api/client';
import { usePlayerStore } from '@/features/player/usePlayerStore';

/** Relie le lecteur à l'API Media Session (contrôles écran verrouillé / touches média). */
export function useMediaSession() {
  const track = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist?.name ?? '',
      album: track.album?.title ?? '',
      artwork: track.coverUrl
        ? [{ src: apiUrl(track.coverUrl), sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });
  }, [track]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => usePlayerStore.getState().resume());
    ms.setActionHandler('pause', () => usePlayerStore.getState().pause());
    ms.setActionHandler('previoustrack', () => usePlayerStore.getState().prev());
    ms.setActionHandler('nexttrack', () => usePlayerStore.getState().next());
    return () => {
      ms.setActionHandler('play', null);
      ms.setActionHandler('pause', null);
      ms.setActionHandler('previoustrack', null);
      ms.setActionHandler('nexttrack', null);
    };
  }, []);
}
