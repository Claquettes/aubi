import { t as translate, useT } from '@/i18n';
import type { ListeningPatterns } from '@/types/api';
import { HEAT_COLORS } from './chartTheme';
import { hourTick, weekdays } from './statsFormat';
import styles from './stats.module.css';

/**
 * Grille jour × heure : où se logent les écoutes dans la semaine. Magnitude
 * → rampe séquentielle une teinte (jamais des couleurs catégorielles).
 */
export function Punchcard({
  cells,
}: {
  cells: ListeningPatterns['punchcard'];
}) {
  const t = useT();
  const map = new Map(cells.map((c) => [`${c.weekday}:${c.hour}`, c.playCount]));
  const max = Math.max(1, ...cells.map((c) => c.playCount));

  return (
    <div>
      <div className={styles.punchWrap}>
        <div className={styles.punchGrid}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={`h${h}`} className={styles.punchHourLabel}>
              {h % 3 === 0 ? hourTick(h) : ''}
            </div>
          ))}
          {weekdays().map((wd, i) => (
            <PunchRow
              key={wd}
              label={wd}
              weekday={i + 1}
              map={map}
              max={max}
            />
          ))}
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
      </div>
    </div>
  );
}

function PunchRow({
  label,
  weekday,
  map,
  max,
}: {
  label: string;
  weekday: number;
  map: Map<string, number>;
  max: number;
}) {
  return (
    <>
      <div className={styles.punchDayLabel}>{label}</div>
      {Array.from({ length: 24 }, (_, h) => {
        const v = map.get(`${weekday}:${h}`) ?? 0;
        const step = v === 0 ? -1 : Math.min(4, Math.floor((v / max) * 4.999));
        return (
          <div
            key={h}
            className={styles.punchCell}
            style={{
              background: step < 0 ? 'var(--chart-empty)' : HEAT_COLORS[step],
            }}
            title={translate('stats.punch.cell', {
              day: label,
              hour: h,
              plays: translate('count.plays', { count: v }),
            })}
          />
        );
      })}
    </>
  );
}
