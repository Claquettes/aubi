import type { CSSProperties, ReactNode } from 'react';
import { apiUrl } from '@/api/client';
import styles from './DetailHero.module.css';

function initials(label: string) {
  return (
    label
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export function DetailHero({
  coverUrl,
  label,
  kicker,
  title,
  subtitle,
  actions,
  accent,
  round = false,
}: {
  coverUrl?: string | null;
  label: string;
  kicker?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  accent?: string | null;
  round?: boolean;
}) {
  const url = coverUrl ? apiUrl(coverUrl) : null;
  const style = accent
    ? ({ '--hero-accent': accent } as CSSProperties)
    : undefined;

  return (
    <header className={styles.hero} style={style}>
      {url && (
        <div
          className={styles.backdrop}
          style={{ backgroundImage: `url("${url}")` }}
        />
      )}
      <div className={styles.wash} />
      <div className={styles.fibers} aria-hidden="true" />
      <div className={styles.content}>
        <div className={`${styles.coverWrap} ${round ? styles.roundWrap : ''}`}>
          <div className={`${styles.cover} ${round ? styles.round : ''}`}>
            {url ? (
              <img src={url} alt="" />
            ) : (
              <span className={styles.initials}>{initials(label)}</span>
            )}
          </div>
        </div>
        <div className={styles.meta}>
          {kicker && <p className={styles.kicker}>{kicker}</p>}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </div>
    </header>
  );
}
