import { handleConnect } from "@/helpers/server/prisma";
import { decimalToNumber } from "@/helpers/common";

import { TrendChartCard } from "./TrendChartCard";
import { buildLast30DayBuckets } from "./dayBuckets";

export async function RealRatingTrendCard() {
  const { buckets, indexFor, windowStart } = buildLast30DayBuckets();

  const data = await handleConnect(async (prisma) => {
    const rows = await prisma.tether_rate.findMany({
      where: { created_at: { gte: windowStart } },
      select: { rate: true, created_at: true },
    });

    const sums = new Array(buckets.length).fill(0);
    const counts = new Array(buckets.length).fill(0);
    for (const row of rows) {
      const i = indexFor(row.created_at);
      if (i < 0) continue;
      sums[i] += decimalToNumber(row.rate);
      counts[i] += 1;
    }

    return buckets.map((b, i) => ({
      date: b.date,
      // null on days with no ratings → the line gaps instead of dropping to 0.
      rating: counts[i] > 0 ? Number((sums[i] / counts[i]).toFixed(2)) : null,
    }));
  });

  return (
    <TrendChartCard
      title="평점 추이"
      description="최근 30일 일별 평균 거래 평점"
      xKey="date"
      data={data ?? buckets.map((b) => ({ date: b.date, rating: null }))}
      series={[{ key: "rating", label: "평균 평점", color: "#f59e0b" }]}
    />
  );
}
