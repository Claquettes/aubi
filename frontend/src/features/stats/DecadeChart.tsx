import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LibraryStats } from '@/types/api';
import { axisProps, ChartTooltip, gridProps } from './chartTheme';
import { int } from './statsFormat';

/** Albums de la bibliothèque par décennie de sortie. */
export function DecadeChart({ data }: { data: LibraryStats['byDecade'] }) {
  const chartData = data.map((d) => ({
    label: `${d.decade}s`,
    albums: d.albumCount,
    tracks: d.trackCount,
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
                          name: 'Albums',
                          value: int(p.albums),
                          color: 'var(--chart-1)',
                        },
                        { name: 'Titres', value: int(p.tracks) },
                      ]
                    : []
                }
              />
            );
          }}
        />
        <Bar
          dataKey="albums"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
