import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ListeningPatterns } from '@/types/api';
import { axisProps, ChartTooltip, gridProps } from './chartTheme';
import { duration, int } from './statsFormat';

/** Horloge d'écoute : combien de titres lancés à chaque heure de la journée. */
export function HourChart({ data }: { data: ListeningPatterns['byHour'] }) {
  const chartData = data.map((d) => ({
    hour: d.hour,
    label: d.hour % 3 === 0 ? `${d.hour}h` : '',
    plays: d.playCount,
    ms: d.totalMs,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        barCategoryGap="18%"
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
                label={p ? `${p.hour}h – ${p.hour + 1}h` : ''}
                rows={
                  p
                    ? [
                        {
                          name: 'Lectures',
                          value: int(p.plays),
                          color: 'var(--chart-1)',
                        },
                        { name: 'Écoute', value: duration(p.ms) },
                      ]
                    : []
                }
              />
            );
          }}
        />
        <Bar dataKey="plays" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
