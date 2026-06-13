import type { HeatmapCell } from '@/types/api';
import styles from './stats.module.css';

const COLORS = [
  'var(--color-bg-subtle)',
  'rgba(212, 168, 83, 0.25)',
  'rgba(212, 168, 83, 0.5)',
  'rgba(212, 168, 83, 0.75)',
  'var(--color-accent)',
];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function HeatmapCalendar({ cells }: { cells: HeatmapCell[] }) {
  const map = new Map(cells.map((c) => [c.date, c.intensity]));

  // 53 semaines glissantes, alignées au lundi
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 7 * 52 - ((start.getDay() + 6) % 7));

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <div className={styles.heatmap}>
      {weeks.map((week, wi) => (
        <div key={wi} className={styles.heatWeek}>
          {week.map((day) => {
            const key = iso(day);
            const intensity = day <= today ? (map.get(key) ?? 0) : -1;
            return (
              <div
                key={key}
                className={styles.heatCell}
                title={key}
                style={{
                  background:
                    intensity < 0 ? 'transparent' : COLORS[intensity] ?? COLORS[0],
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
