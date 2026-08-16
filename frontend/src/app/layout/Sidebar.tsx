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
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Rubriques : la barre se lit comme un sommaire, pas comme une liste plate. */
const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Bibliothèque',
    items: [
      // Pas de `end` : la rubrique reste allumée sur /music/albums/… et /music/artists/…
      { to: '/music', label: 'Musique', icon: Music2 },
      { to: '/concerts', label: 'Concerts', icon: Mic2 },
      { to: '/audiobooks', label: 'Livres audio', icon: BookOpen },
    ],
  },
  {
    title: 'Ma sélection',
    items: [
      { to: '/playlists', label: 'Playlists', icon: ListMusic },
      { to: '/likes', label: 'Favoris', icon: Heart },
    ],
  },
  {
    title: 'Explorer',
    items: [
      { to: '/stats', label: 'Statistiques', icon: BarChart2 },
      { to: '/graph', label: 'Graphe', icon: Waypoints },
    ],
  },
];

function Link({ to, label, icon: Icon }: Item) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.link} ${isActive ? styles.active : ''}`
      }
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className={styles.aside}>
      <NavLink to="/music" end className={styles.brand}>
        <span className={styles.wordmark}>aubi</span>
        <span className={styles.tagline}>bibliothèque personnelle</span>
      </NavLink>

      <NavLink
        to="/search"
        className={({ isActive }) =>
          `${styles.search} ${isActive ? styles.searchActive : ''}`
        }
      >
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Rechercher…</span>
      </NavLink>

      <nav className={styles.nav} aria-label="Navigation principale">
        {SECTIONS.map((section) => (
          <div key={section.title} className={styles.section}>
            <p className={styles.eyebrow}>{section.title}</p>
            {section.items.map((item) => (
              <Link key={item.to} {...item} />
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.foot}>
        <Link to="/settings" label="Paramètres" icon={Settings} />
      </div>
    </aside>
  );
}
