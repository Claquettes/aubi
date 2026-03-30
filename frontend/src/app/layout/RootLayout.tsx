import { Outlet } from 'react-router-dom';
import { MiniPlayer } from '@/features/player/MiniPlayer';
import { useAudioEngine } from '@/features/player/useAudioEngine';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import styles from './RootLayout.module.css';

export function RootLayout() {
  useAudioEngine();
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}
