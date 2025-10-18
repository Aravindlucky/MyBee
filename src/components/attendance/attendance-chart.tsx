'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface AttendanceChartProps {
  stats: {
    present: number;
    absent: number;
    excused: number;
  };
}

const COLORS = {
  present: 'hsl(var(--primary))',
  absent: 'hsl(var(--destructive))',
  excused: 'hsl(var(--muted-foreground))',
};

export function AttendanceChart({ stats }: AttendanceChartProps) {
  const data = [
    { name: 'Present', value: stats.present },
    { name: 'Absent', value: stats.absent },
    { name: 'Excused', value: stats.excused },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No attendance data yet.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 130 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={60}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
                background: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
