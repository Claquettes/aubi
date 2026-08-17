import {
  BarChart2,
  BookOpen,
  Heart,
  Music2,
  Search,
  Waypoints,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { useEnabledSections } from '@/hooks/useLibraries';
import { useT } from '@/i18n';
import styles from './BottomNav.module.css';

const item = (to: string, label: string, Icon: typeof Music2) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `${styles.link} ${isActive ? styles.active : ''}`
    }
  >
    <Icon size={22} strokeWidth={1.5} />
    {label}
  </NavLink>
);

export function BottomNav() {
  const t = useT();
  const hasTrack = usePlayerStore((s) => s.currentTrack != null);
  // Une rubrique sans bibliothèque active n'a rien à montrer : on la retire.
  const isEnabled = useEnabledSections();
  return (
    <nav className={`${styles.nav} ${hasTrack ? styles.withPlayer : ''}`}>
      {isEnabled('music') && item('/music', t('nav.music'), Music2)}
      {isEnabled('audiobook') && item('/audiobooks', t('nav.books'), BookOpen)}
      {item('/search', t('nav.search'), Search)}
      {item('/likes', t('nav.likes'), Heart)}
      {item('/graph', t('nav.graph'), Waypoints)}
      {item('/stats', t('nav.statsShort'), BarChart2)}
    </nav>
  );
}
