import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

function L({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.link} ${isActive ? styles.active : ''}`
      }
    >
      {children}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className={styles.aside}>
      <div className={styles.brand}>aubi</div>
      <L to="/music">Musique</L>
      <L to="/concerts">Concerts</L>
      <L to="/audiobooks">Livres audio</L>
      <L to="/playlists">Playlists</L>
      <L to="/likes">Favoris</L>
      <L to="/stats">Statistiques</L>
      <L to="/search">Recherche</L>
      <L to="/settings">Paramètres</L>
    </aside>
  );
}
