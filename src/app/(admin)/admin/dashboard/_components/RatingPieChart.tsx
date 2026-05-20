"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface RatingPieChartProps {
  distribution: Array<{ stars: number; count: number; color: string }>;
  avg: number;
  total: number;
}

export function RatingPieChart({
  distribution,
  avg,
  total,
}: RatingPieChartProps) {
  return (
    <div className="h-[140px] w-[140px] shrink-0 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={distribution}
            dataKey="count"
            nameKey="stars"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
          >
            {distribution.map((d) => (
              <Cell key={d.stars} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: number, _name, item: any) => [
              `${v}건`,
              `${item.payload.stars}점`,
            ]}
            contentStyle={{ fontSize: 11, padding: "4px 8px" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold">{avg.toFixed(2)}</span>
        <span className="text-[10px] text-muted-foreground">
          평균 {total}건
        </span>
      </div>
    </div>
  );
}
