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
      <L to="/music" icon={<Music2 size={19} strokeWidth={1.5} />}>
        Musique
      </L>
      <L to="/concerts" icon={<Mic2 size={19} strokeWidth={1.5} />}>
        Concerts
      </L>
      <L to="/audiobooks" icon={<BookOpen size={19} strokeWidth={1.5} />}>
        Livres audio
      </L>
      <L to="/playlists" icon={<ListMusic size={19} strokeWidth={1.5} />}>
        Playlists
      </L>
      <L to="/likes" icon={<Heart size={19} strokeWidth={1.5} />}>
        Favoris
      </L>
      <L to="/stats" icon={<BarChart2 size={19} strokeWidth={1.5} />}>
        Statistiques
      </L>
      <L to="/graph" icon={<Waypoints size={19} strokeWidth={1.5} />}>
        Graphe
      </L>
      <div className={styles.spacer} />
      <L to="/search" icon={<Search size={19} strokeWidth={1.5} />}>
        Recherche
      </L>
      <L to="/settings" icon={<Settings size={19} strokeWidth={1.5} />}>
        Paramètres
      </L>
    </aside>
  );
}
