import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useT } from '@/i18n';
import type { ListeningPatterns } from '@/types/api';
import { axisProps, ChartTooltip, gridProps } from './chartTheme';
import { duration, int, weekdays } from './statsFormat';

/** Écoute par jour de la semaine (lundi → dimanche). */
export function WeekdayChart({
  data,
}: {
  data: ListeningPatterns['byWeekday'];
}) {
  const t = useT();
  const names = weekdays();
  const chartData = data.map((d) => ({
    label: names[d.weekday - 1] ?? String(d.weekday),
    minutes: Math.round(d.totalMs / 60000),
    ms: d.totalMs,
    plays: d.playCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        barCategoryGap="26%"
      >
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} interval={0} />
        <YAxis {...axisProps} width={40} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'var(--chart-empty)' }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as
              | (typeof chartData)[number]
              | undefined;
            return (
              <ChartTooltip
                active={active && !!p}
                label={p?.label}
                rows={
                  p
                    ? [
                        {
                          name: t('stats.chart.listening'),
                          value: duration(p.ms),
                          color: 'var(--chart-1)',
                        },
                        { name: t('stats.chart.plays'), value: int(p.plays) },
                      ]
                    : []
                }
              />
            );
          }}
        />
        <Bar
          dataKey="minutes"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={44}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
