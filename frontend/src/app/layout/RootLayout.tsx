import { Outlet } from 'react-router-dom';
import { FullPlayer } from '@/features/player/FullPlayer';
import { MiniPlayer } from '@/features/player/MiniPlayer';
import { useAudioEngine } from '@/features/player/useAudioEngine';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useNowPlayingTheme } from '@/hooks/useNowPlayingTheme';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import styles from './RootLayout.module.css';

export function RootLayout() {
  useAudioEngine();
  useMediaSession();
  useKeyboardShortcuts();
  useNowPlayingTheme();
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <MiniPlayer />
      <FullPlayer />
      <BottomNav />
    </div>
  );
}
