import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyStat } from '@/types/api';

export function ListeningChart({ data }: { data: DailyStat[] }) {
  const chartData = data.map((d) => ({
    day: d.day.slice(5),
    minutes: Math.round(d.totalMs / 60000),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="listenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a853" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#d4a853" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="day"
          tick={{ fill: '#8a8480', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: '#8a8480', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: '#141414',
            border: '1px solid #2a2826',
            borderRadius: 4,
            fontSize: 12,
          }}
          labelStyle={{ color: '#f0ede8' }}
          formatter={(v: number | string) => [`${v} min`, 'Écoute']}
        />
        <Area
          type="monotone"
          dataKey="minutes"
          stroke="#d4a853"
          fill="url(#listenGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
