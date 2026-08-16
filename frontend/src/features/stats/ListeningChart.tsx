import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useT } from '@/i18n';
import type { DailyStat } from '@/types/api';
import { axisProps, ChartTooltip, gridProps } from './chartTheme';
import { dayLabel, duration } from './statsFormat';

/** Minutes écoutées par jour. Une seule série : pas de légende, le titre suffit. */
export function ListeningChart({ data }: { data: DailyStat[] }) {
  const t = useT();
  const chartData = data.map((d) => ({
    day: d.day,
    short: `${Number(d.day.slice(8))}/${Number(d.day.slice(5, 7))}`,
    minutes: Math.round(d.totalMs / 60000),
    ms: d.totalMs,
    plays: d.playCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
      >
        <defs>
          <linearGradient id="listenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.42} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="short" {...axisProps} minTickGap={28} />
        <YAxis {...axisProps} width={40} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: 'var(--color-hairline-strong)', strokeWidth: 1 }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as
              | (typeof chartData)[number]
              | undefined;
            return (
              <ChartTooltip
                active={active && !!p}
                label={p ? dayLabel(p.day) : ''}
                rows={
                  p
                    ? [
                        {
                          name: t('stats.chart.listening'),
                          value: duration(p.ms),
                          color: 'var(--chart-1)',
                        },
                        {
                          name: t('stats.chart.playedTracks'),
                          value: String(p.plays),
                        },
                      ]
                    : []
                }
              />
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="minutes"
          stroke="var(--chart-1)"
          fill="url(#listenGrad)"
          strokeWidth={2}
          activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--chart-1)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
