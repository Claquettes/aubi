import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import styles from './stats.module.css';

export interface RankedItem {
  id: string;
  label: string;
  sub?: ReactNode;
  value: number;
  valueLabel: string;
  coverUrl?: string | null;
  to?: string;
  onClick?: () => void;
}

/**
 * Classement en barres horizontales. Catégories nominales : toutes les barres
 * portent la même teinte (créneau 1) — la longueur encode déjà la grandeur,
 * la couleur n'a rien à dire de plus.
 */
export function RankedBars({
  items,
  showRank = true,
  showCover = true,
}: {
  items: RankedItem[];
  showRank?: boolean;
  showCover?: boolean;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ol className={styles.rankList}>
      {items.map((it, i) => {
        const inner = (
          <>
            {showRank && <span className={styles.rank}>{i + 1}</span>}
            {showCover && (
              <CoverArt src={it.coverUrl} label={it.label} size="xs" />
            )}
            <div className={styles.rankMeta}>
              <div className={styles.rankLabel}>{it.label}</div>
              {it.sub && <div className={styles.rankSub}>{it.sub}</div>}
              <div className={styles.rankTrack} aria-hidden="true">
                <div
                  className={styles.rankBar}
                  style={{ width: `${Math.max(2, (it.value / max) * 100)}%` }}
                />
              </div>
            </div>
            <span className={styles.rankValue}>{it.valueLabel}</span>
          </>
        );
        return (
          <li key={it.id} className={styles.rankRow}>
            {it.to ? (
              <Link to={it.to} className={styles.rankLink}>
                {inner}
              </Link>
            ) : it.onClick ? (
              <button
                type="button"
                className={styles.rankLink}
                onClick={it.onClick}
              >
                {inner}
              </button>
            ) : (
              <div className={styles.rankLink}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
