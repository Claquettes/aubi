import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyState } from '@/components/layout/EmptyState';
import type { SectionSplit } from '@/types/api';
import { CHART_COLORS, ChartLegend, ChartTooltip } from './chartTheme';
import { duration, percent, sectionLabel } from './statsFormat';
import styles from './stats.module.css';

/** Répartition musique / concerts / livres audio. Trois créneaux au plus :
 *  ce sont les trois teintes qui passent aussi le test « toutes paires ». */
export function SectionDonut({ data }: { data: SectionSplit[] }) {
  const items = data
    .filter((d) => d.totalMs > 0)
    .map((d, i) => ({
      name: sectionLabel(d.section),
      value: d.totalMs,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  if (!items.length) return <EmptyState>Pas encore de données.</EmptyState>;

  const total = items.reduce((a, b) => a + b.value, 0);

  return (
    <div>
      <div className={styles.donutWrap}>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={82}
              paddingAngle={2}
              stroke="var(--color-canvas)"
              strokeWidth={2}
            >
              {items.map((it) => (
                <Cell key={it.name} fill={it.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as
                  | (typeof items)[number]
                  | undefined;
                return (
                  <ChartTooltip
                    active={active && !!p}
                    label={p?.name}
                    rows={
                      p
                        ? [
                            {
                              name: 'Écoute',
                              value: duration(p.value),
                              color: p.color,
                            },
                            { name: 'Part', value: percent(p.value / total, 1) },
                          ]
                        : []
                    }
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.donutCenter}>
          <span className={styles.donutValue}>{duration(total)}</span>
          <span className={styles.donutCaption}>au total</span>
        </div>
      </div>
      <ChartLegend
        items={items.map((it) => ({
          label: it.name,
          color: it.color,
          value: percent(it.value / total),
        }))}
      />
    </div>
  );
}
