import type { ReactNode } from 'react';
import styles from './stats.module.css';

export interface Tile {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}

/** Grands nombres façon page de chiffres imprimée : filets, pas de cartes. */
export function StatTiles({
  tiles,
  columns = 4,
}: {
  tiles: Tile[];
  columns?: 3 | 4 | 5;
}) {
  return (
    <div
      className={styles.tiles}
      style={{ ['--tile-columns' as string]: columns }}
    >
      {tiles.map((t) => (
        <div key={t.label} className={styles.tile}>
          <span className={styles.tileValue}>{t.value}</span>
          <span className={styles.tileLabel}>{t.label}</span>
          {t.hint && <span className={styles.tileHint}>{t.hint}</span>}
        </div>
      ))}
    </div>
  );
}
