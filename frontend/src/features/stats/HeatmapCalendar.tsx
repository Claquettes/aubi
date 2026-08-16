import { useT } from '@/i18n';
import type { HeatmapCell } from '@/types/api';
import { HEAT_COLORS } from './chartTheme';
import {
  dayLabel,
  duration,
  monthInitials,
  monthNames,
} from './statsFormat';
import styles from './stats.module.css';

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function HeatmapCalendar({ cells }: { cells: HeatmapCell[] }) {
  const t = useT();
  const shortMonths = monthInitials();
  const longMonths = monthNames();
  const map = new Map(cells.map((c) => [c.date, c]));

  // 53 semaines glissantes, alignées au lundi.
  const today = new Date();
  today.setHours(12, 0, 0, 0);
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
    <div>
      <div className={styles.heatScroll}>
        <div className={styles.heatInner}>
          <div className={styles.heatMonths}>
            {weeks.map((week, wi) => {
              // Étiquette au premier lundi de chaque mois.
              const first = week[0];
              const prev = weeks[wi - 1]?.[0];
              const isNewMonth =
                !prev || prev.getMonth() !== first.getMonth();
              return (
                <div key={wi} className={styles.heatMonthCell}>
                  {isNewMonth ? shortMonths[first.getMonth()] : ''}
                </div>
              );
            })}
          </div>
          <div className={styles.heatmap}>
            {weeks.map((week, wi) => (
              <div key={wi} className={styles.heatWeek}>
                {week.map((day) => {
                  const key = iso(day);
                  const cell = map.get(key);
                  const future = day > today;
                  const level = cell?.intensity ?? 0;
                  return (
                    <div
                      key={key}
                      className={styles.heatCell}
                      title={
                        future
                          ? ''
                          : cell
                            ? t('stats.heat.cell', {
                                day: dayLabel(key),
                                duration: duration(cell.totalMs),
                                plays: t('count.plays', {
                                  count: cell.playCount,
                                }),
                              })
                            : t('stats.heat.empty', { day: dayLabel(key) })
                      }
                      style={{
                        background: future
                          ? 'transparent'
                          : level > 0
                            ? HEAT_COLORS[Math.min(4, level - 1)]
                            : 'var(--chart-empty)',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.scaleRow}>
        <span className={styles.scaleLabel}>{t('stats.chart.less')}</span>
        <span
          className={styles.scaleCell}
          style={{ background: 'var(--chart-empty)' }}
        />
        {HEAT_COLORS.map((c) => (
          <span key={c} className={styles.scaleCell} style={{ background: c }} />
        ))}
        <span className={styles.scaleLabel}>{t('stats.chart.more')}</span>
        <span className={styles.scaleSpacer} />
        <span className={styles.scaleLabel}>
          {longMonths[start.getMonth()]} {start.getFullYear()} →{' '}
          {longMonths[today.getMonth()]} {today.getFullYear()}
        </span>
      </div>
    </div>
  );
}
