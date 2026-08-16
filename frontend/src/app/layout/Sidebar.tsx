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
import { useT, type TFn, type TKey } from '@/i18n';
import styles from './Sidebar.module.css';

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Rubriques : la barre se lit comme un sommaire, pas comme une liste plate. */
const SECTIONS: {
  title: TKey;
  items: { to: string; label: TKey; icon: LucideIcon }[];
}[] = [
  {
    title: 'nav.section.library',
    items: [
      // Pas de `end` : la rubrique reste allumée sur /music/albums/… et /music/artists/…
      { to: '/music', label: 'nav.music', icon: Music2 },
      { to: '/concerts', label: 'nav.concerts', icon: Mic2 },
      { to: '/audiobooks', label: 'nav.audiobooks', icon: BookOpen },
    ],
  },
  {
    title: 'nav.section.mine',
    items: [
      { to: '/playlists', label: 'nav.playlists', icon: ListMusic },
      { to: '/likes', label: 'nav.likes', icon: Heart },
    ],
  },
  {
    title: 'nav.section.explore',
    items: [
      { to: '/stats', label: 'nav.stats', icon: BarChart2 },
      { to: '/graph', label: 'nav.graph', icon: Waypoints },
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
  const t: TFn = useT();

  return (
    <aside className={styles.aside}>
      <NavLink to="/music" end className={styles.brand}>
        <span className={styles.wordmark}>aubi</span>
        <span className={styles.tagline}>{t('nav.tagline')}</span>
      </NavLink>

      <NavLink
        to="/search"
        className={({ isActive }) =>
          `${styles.search} ${isActive ? styles.searchActive : ''}`
        }
      >
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>{t('nav.searchLink')}</span>
      </NavLink>

      <nav className={styles.nav} aria-label={t('nav.aria')}>
        {SECTIONS.map((section) => (
          <div key={section.title} className={styles.section}>
            <p className={styles.eyebrow}>{t(section.title)}</p>
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={t(item.label)}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.foot}>
        <Link to="/settings" label={t('nav.settings')} icon={Settings} />
      </div>
    </aside>
  );
}
