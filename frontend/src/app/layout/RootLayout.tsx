import { Outlet } from 'react-router-dom';
import { AmbientBackground } from '@/components/media/AmbientBackground';
import { FullPlayer } from '@/features/player/FullPlayer';
import { MiniPlayer } from '@/features/player/MiniPlayer';
import { useAudioEngine } from '@/features/player/useAudioEngine';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useAppTheme } from '@/hooks/appTheme';
import { SelectionBar } from '@/features/selection/SelectionBar';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import styles from './RootLayout.module.css';

export function RootLayout() {
  useAudioEngine();
  useMediaSession();
  useKeyboardShortcuts();
  useAppTheme();
  return (
    <div className={styles.shell}>
      <AmbientBackground />
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <MiniPlayer />
      <FullPlayer />
      <BottomNav />
      <SelectionBar />
    </div>
  );
}
