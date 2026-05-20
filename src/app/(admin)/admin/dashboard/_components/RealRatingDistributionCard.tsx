import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { handleConnect } from "@/helpers/server/prisma";
import { decimalToNumber } from "@/helpers/common";

import { RatingPieChart } from "./RatingPieChart";

const COLORS: Record<number, string> = {
  5: "#10b981",
  4: "#34d399",
  3: "#f59e0b",
  2: "#fb923c",
  1: "#ef4444",
};

export async function RealRatingDistributionCard() {
  const stats = await handleConnect(async (prisma) => {
    const rows = await prisma.tether_rate.findMany({ select: { rate: true } });
    const buckets = new Map<number, number>([
      [5, 0],
      [4, 0],
      [3, 0],
      [2, 0],
      [1, 0],
    ]);
    let sum = 0;
    let n = 0;
    for (const r of rows) {
      const val = decimalToNumber(r.rate);
      const bucket = Math.min(5, Math.max(1, Math.round(val)));
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
      sum += val;
      n += 1;
    }
    return {
      distribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: buckets.get(stars) ?? 0,
        color: COLORS[stars],
      })),
      total: n,
      avg: n > 0 ? sum / n : 0,
    };
  });

  const data =
    stats ??
    ({
      distribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: 0,
        color: COLORS[stars],
      })),
      total: 0,
      avg: 0,
    } as const);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">거래 평점 분포</CardTitle>
        <p className="text-xs text-muted-foreground">누적 거래 평가</p>
      </CardHeader>
      <CardContent>
        {data.total === 0 ? (
          <div className="py-6 text-sm text-muted-foreground text-center">
            아직 평점 데이터가 없습니다.
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <RatingPieChart
              distribution={data.distribution}
              avg={data.avg}
              total={data.total}
            />
            <ul className="flex-1 text-xs space-y-1">
              {data.distribution.map((r) => {
                const pct =
                  data.total > 0
                    ? ((r.count / data.total) * 100).toFixed(1)
                    : "0.0";
                return (
                  <li key={r.stars} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: r.color }}
                    />
                    <span className="w-8">{r.stars}점</span>
                    <span className="text-muted-foreground">{r.count}건</span>
                    <span className="ml-auto text-muted-foreground">
                      {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
