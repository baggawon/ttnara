import { handleConnect } from "@/helpers/server/prisma";

import { TrendChartCard } from "./TrendChartCard";
import { buildLast30DayBuckets } from "./dayBuckets";

export async function RealUserTrendCard() {
  const { buckets, indexFor, windowStart } = buildLast30DayBuckets();

  const data = await handleConnect(async (prisma) => {
    const [signupRows, loginRows] = await Promise.all([
      prisma.user.findMany({
        where: { created_at: { gte: windowStart } },
        select: { created_at: true },
      }),
      prisma.login_history.findMany({
        where: { created_at: { gte: windowStart } },
        select: { uid: true, created_at: true },
      }),
    ]);

    const signupsPerDay = new Array(buckets.length).fill(0);
    for (const row of signupRows) {
      const i = indexFor(row.created_at);
      if (i >= 0) signupsPerDay[i] += 1;
    }

    const dailyUsers: Array<Set<string>> = Array.from(
      { length: buckets.length },
      () => new Set<string>()
    );
    for (const row of loginRows) {
      const i = indexFor(row.created_at);
      if (i >= 0) dailyUsers[i].add(row.uid);
    }

    return buckets.map((b, i) => ({
      date: b.date,
      signups: signupsPerDay[i],
      dau: dailyUsers[i].size,
    }));
  });

  return (
    <TrendChartCard
      title="사용자 추이"
      description="최근 30일 신규 가입 / 일간 활성 사용자"
      xKey="date"
      data={data ?? buckets.map((b) => ({ date: b.date, signups: 0, dau: 0 }))}
      series={[
        { key: "signups", label: "신규 가입", color: "#6366f1" },
        { key: "dau", label: "DAU", color: "#10b981" },
      ]}
    />
  );
}
