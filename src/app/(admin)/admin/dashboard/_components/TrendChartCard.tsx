"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendChartCardProps {
  title: string;
  description?: string;
  data: Array<Record<string, string | number | null>>;
  series: Array<{ key: string; label: string; color: string }>;
  xKey: string;
  /** Optional footer label; omit to hide the footer entirely. */
  footer?: string;
}

export function TrendChartCard({
  title,
  description,
  data,
  series,
  xKey,
  footer,
}: TrendChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[180px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 0, left: -8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-muted-foreground/20"
              />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} width={36} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  padding: "6px 8px",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                }}
                labelStyle={{ fontSize: 10, fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="text-[10px] text-muted-foreground border-t pt-2">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
