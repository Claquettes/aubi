import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyState } from '@/components/layout/EmptyState';
import type { DailyStat } from '@/types/api';

const COLORS = ['#d4a853', '#8a8480', '#c0392b'];
const LABELS: Record<string, string> = {
  music: 'Musique',
  concert: 'Concerts',
  audiobook: 'Livres audio',
};

export function SectionDonut({ daily }: { daily: DailyStat[] }) {
  const totals: Record<string, number> = {};
  for (const d of daily) {
    for (const [k, v] of Object.entries(d.bySection ?? {})) {
      totals[k] = (totals[k] ?? 0) + v.totalMs;
    }
  }
  const data = Object.entries(totals).map(([name, value]) => ({
    name: LABELS[name] ?? name,
    value,
  }));

  if (!data.length) return <EmptyState>Pas encore de données.</EmptyState>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number | string) => `${Math.round(Number(v) / 60000)} min`}
          contentStyle={{
            background: '#141414',
            border: '1px solid #2a2826',
            borderRadius: 4,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
