import { handleConnect } from "@/helpers/server/prisma";
import { decimalToNumber } from "@/helpers/common";
import { TetherProposalStatus } from "@/helpers/types";

import { TrendChartCard } from "./TrendChartCard";
import { buildLast30DayBuckets } from "./dayBuckets";

export async function RealVolumeTrendCard() {
  const { buckets, indexFor, windowStart } = buildLast30DayBuckets();

  const result = await handleConnect(async (prisma) => {
    // Volume is realised on completion, so bucket by updated_at (the moment the
    // proposal transitioned to "complete"), not by created_at.
    const rows = await prisma.tether_proposal.findMany({
      where: {
        status: TetherProposalStatus.Complete,
        updated_at: { gte: windowStart },
      },
      select: { price: true, qty: true, updated_at: true },
    });

    const krwPerDay = new Array(buckets.length).fill(0);
    let totalQty = 0;
    for (const row of rows) {
      const i = indexFor(row.updated_at);
      if (i < 0) continue;
      const qty = decimalToNumber(row.qty);
      const krw = decimalToNumber(row.price) * qty;
      krwPerDay[i] += krw;
      totalQty += qty;
    }

    return {
      data: buckets.map((b, i) => ({
        date: b.date,
        // Display in 만원 (10,000 KRW) so the axis stays readable.
        volume: Math.round(krwPerDay[i] / 10000),
      })),
      totalQty,
    };
  });

  const data =
    result?.data ?? buckets.map((b) => ({ date: b.date, volume: 0 }));
  const totalQty = result?.totalQty ?? 0;

  return (
    <TrendChartCard
      title="거래액 추이"
      description="최근 30일 완료 거래액 (만원)"
      xKey="date"
      data={data}
      series={[{ key: "volume", label: "거래액(만원)", color: "#0ea5e9" }]}
      footer={`최근 30일 거래 수량 합계: ${totalQty.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })} Tether`}
    />
  );
}
