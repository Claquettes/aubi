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
import { axisProps, ChartLegend, ChartTooltip, gridProps } from './chartTheme';
import { int, monthLabel } from './statsFormat';

/**
 * Découvertes par mois : titres et artistes entendus pour la première fois.
 * Deux séries côte à côte (pas empilées) — on compare deux grandeurs de
 * même nature, l'empilement rendrait la seconde illisible.
 */
export function DiscoveryChart({ data }: { data: MonthlyStat[] }) {
  const chartData = data.map((d) => ({
    month: d.month,
    label: monthLabel(d.month),
    titres: d.newTracks,
    artistes: d.newArtists,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          barCategoryGap="24%"
          barGap={2}
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
                            name: 'Nouveaux titres',
                            value: int(p.titres),
                            color: 'var(--chart-1)',
                          },
                          {
                            name: 'Nouveaux artistes',
                            value: int(p.artistes),
                            color: 'var(--chart-2)',
                          },
                        ]
                      : []
                  }
                />
              );
            }}
          />
          <Bar
            dataKey="titres"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            dataKey="artistes"
            fill="var(--chart-2)"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend
        items={[
          { label: 'Nouveaux titres', color: 'var(--chart-1)' },
          { label: 'Nouveaux artistes', color: 'var(--chart-2)' },
        ]}
      />
    </div>
  );
}
