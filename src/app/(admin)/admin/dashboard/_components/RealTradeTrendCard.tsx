import { handleConnect } from "@/helpers/server/prisma";
import { TetherProposalStatus } from "@/helpers/types";

import { TrendChartCard } from "./TrendChartCard";
import { buildLast30DayBuckets } from "./dayBuckets";

export async function RealTradeTrendCard() {
  const { buckets, indexFor, windowStart } = buildLast30DayBuckets();

  const data = await handleConnect(async (prisma) => {
    const rows = await prisma.tether_proposal.findMany({
      where: { created_at: { gte: windowStart } },
      select: { created_at: true, status: true },
    });

    const attempts = new Array(buckets.length).fill(0);
    const completed = new Array(buckets.length).fill(0);
    for (const row of rows) {
      const i = indexFor(row.created_at);
      if (i < 0) continue;
      attempts[i] += 1;
      if (row.status === TetherProposalStatus.Complete) completed[i] += 1;
    }

    return buckets.map((b, i) => ({
      date: b.date,
      attempts: attempts[i],
      completed: completed[i],
    }));
  });

  return (
    <TrendChartCard
      title="거래 추이"
      description="최근 30일 거래 제안 / 완료"
      xKey="date"
      data={
        data ??
        buckets.map((b) => ({ date: b.date, attempts: 0, completed: 0 }))
      }
      series={[
        { key: "attempts", label: "제안", color: "#0ea5e9" },
        { key: "completed", label: "완료", color: "#22c55e" },
      ]}
    />
  );
}
