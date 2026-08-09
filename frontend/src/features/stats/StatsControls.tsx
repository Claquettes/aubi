import type { StatsPeriod } from '@/types/api';
import styles from './stats.module.css';

export const PERIODS: { key: StatsPeriod; label: string; days: number }[] = [
  { key: 'week', label: '7 jours', days: 7 },
  { key: 'month', label: '30 jours', days: 30 },
  { key: 'year', label: '1 an', days: 365 },
  { key: 'all', label: 'Tout', days: 365 },
];

export function PeriodSelector({
  value,
  onChange,
}: {
  value: StatsPeriod;
  onChange: (p: StatsPeriod) => void;
}) {
  return (
    <div className={styles.segmented} role="group" aria-label="Période">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          className={`${styles.segment} ${value === p.key ? styles.segmentOn : ''}`}
          aria-pressed={value === p.key}
          onClick={() => onChange(p.key)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          className={`${styles.tab} ${value === t.key ? styles.tabOn : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Block({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.block}>
      <div className={styles.blockHead}>
        <h2 className={styles.blockTitle}>{title}</h2>
        {caption && <p className={styles.blockCaption}>{caption}</p>}
      </div>
      {children}
    </section>
  );
}
