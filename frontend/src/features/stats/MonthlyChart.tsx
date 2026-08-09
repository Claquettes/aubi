import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyStat } from '@/types/api';
import { axisProps, ChartTooltip, gridProps } from './chartTheme';
import { duration, int, monthLabel } from './statsFormat';

/** Volume écouté mois par mois — une série, barres à extrémité arrondie. */
export function MonthlyChart({ data }: { data: MonthlyStat[] }) {
  const chartData = data.map((d) => ({
    month: d.month,
    label: monthLabel(d.month),
    minutes: Math.round(d.totalMs / 60000),
    ms: d.totalMs,
    plays: d.playCount,
    tracks: d.distinctTracks,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        barCategoryGap="22%"
      >
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} minTickGap={8} />
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
                label={p ? monthLabel(p.month) : ''}
                rows={
                  p
                    ? [
                        {
                          name: 'Écoute',
                          value: duration(p.ms),
                          color: 'var(--chart-1)',
                        },
                        { name: 'Lectures', value: int(p.plays) },
                        { name: 'Titres différents', value: int(p.tracks) },
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
          maxBarSize={38}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
