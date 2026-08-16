import { useT, type TKey } from '@/i18n';
import type { StatsPeriod } from '@/types/api';
import styles from './stats.module.css';

export const PERIODS: { key: StatsPeriod; label: TKey; days: number }[] = [
  { key: 'week', label: 'stats.period.week', days: 7 },
  { key: 'month', label: 'stats.period.month', days: 30 },
  { key: 'year', label: 'stats.period.year', days: 365 },
  { key: 'all', label: 'stats.period.all', days: 365 },
];

export function PeriodSelector({
  value,
  onChange,
}: {
  value: StatsPeriod;
  onChange: (p: StatsPeriod) => void;
}) {
  const t = useT();
  return (
    <div
      className={styles.segmented}
      role="group"
      aria-label={t('stats.periodAria')}
    >
      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          className={`${styles.segment} ${value === p.key ? styles.segmentOn : ''}`}
          aria-pressed={value === p.key}
          onClick={() => onChange(p.key)}
        >
          {t(p.label)}
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
