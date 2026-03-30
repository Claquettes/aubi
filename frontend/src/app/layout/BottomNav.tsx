import { BarChart2, BookOpen, Heart, Mic2, Music2, Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { usePlayerStore } from '@/features/player/usePlayerStore';
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
  const hasTrack = usePlayerStore((s) => s.currentTrack != null);
  return (
    <nav className={`${styles.nav} ${hasTrack ? styles.withPlayer : ''}`}>
      {item('/music', 'Musique', Music2)}
      {item('/concerts', 'Concerts', Mic2)}
      {item('/audiobooks', 'Livres', BookOpen)}
      {item('/search', 'Recherche', Search)}
      {item('/likes', 'Favoris', Heart)}
      {item('/stats', 'Stats', BarChart2)}
    </nav>
  );
}
