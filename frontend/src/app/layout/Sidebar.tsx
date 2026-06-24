import {
  BarChart2,
  BookOpen,
  Heart,
  ListMusic,
  Mic2,
  Music2,
  Search,
  Settings,
  Waypoints,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

function L({
  to,
  icon,
  children,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/music'}
      className={({ isActive }) =>
        `${styles.link} ${isActive ? styles.active : ''}`
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className={styles.aside}>
      <div className={styles.brand}>aubi</div>
      <L to="/music" icon={<Music2 size={20} strokeWidth={1.6} />}>
        Musique
      </L>
      <L to="/concerts" icon={<Mic2 size={20} strokeWidth={1.6} />}>
        Concerts
      </L>
      <L to="/audiobooks" icon={<BookOpen size={20} strokeWidth={1.6} />}>
        Livres audio
      </L>
      <L to="/playlists" icon={<ListMusic size={20} strokeWidth={1.6} />}>
        Playlists
      </L>
      <L to="/likes" icon={<Heart size={20} strokeWidth={1.6} />}>
        Favoris
      </L>
      <L to="/stats" icon={<BarChart2 size={20} strokeWidth={1.6} />}>
        Statistiques
      </L>
      <L to="/graph" icon={<Waypoints size={20} strokeWidth={1.6} />}>
        Graphe
      </L>
      <div className={styles.spacer} />
      <L to="/search" icon={<Search size={20} strokeWidth={1.6} />}>
        Recherche
      </L>
      <L to="/settings" icon={<Settings size={20} strokeWidth={1.6} />}>
        Paramètres
      </L>
    </aside>
  );
}
