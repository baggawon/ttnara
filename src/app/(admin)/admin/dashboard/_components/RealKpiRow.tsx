import { ArrowRightLeft, Inbox, UserPlus, Users } from "lucide-react";

import { handleConnect } from "@/helpers/server/prisma";
import { now } from "@/helpers/basic";
import { TetherProposalStatus } from "@/helpers/types";

import { KpiTile } from "./KpiTile";

const pct = (curr: number, base: number): number | undefined => {
  if (base === 0) return curr === 0 ? 0 : undefined;
  return ((curr - base) / base) * 100;
};

export async function RealKpiRow() {
  const today = now().startOf("day").toDate();
  const yesterday = now().subtract(1, "day").startOf("day").toDate();
  const sevenDaysAgo = now().subtract(7, "day").startOf("day").toDate();
  const dayAgo = now().subtract(1, "day").toDate();

  const counts = await handleConnect(async (prisma) => {
    const [
      signupsToday,
      signupsYesterday,
      activeUsers24h,
      activeUsersLast7d,
      openProposals,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count({ where: { created_at: { gte: today } } }),
      prisma.user.count({
        where: { created_at: { gte: yesterday, lt: today } },
      }),
      prisma.login_history
        .findMany({
          where: { created_at: { gte: dayAgo } },
          select: { uid: true },
          distinct: ["uid"],
        })
        .then((rows) => rows.length),
      prisma.login_history
        .findMany({
          where: { created_at: { gte: sevenDaysAgo, lt: dayAgo } },
          select: { uid: true },
          distinct: ["uid"],
        })
        .then((rows) => rows.length),
      prisma.tether_proposal.count({
        where: { status: TetherProposalStatus.Open },
      }),
      prisma.chat_report.count(),
    ]);

    return {
      signupsToday,
      signupsYesterday,
      activeUsers24h,
      // average DAU across previous 6 days (sevenDaysAgo → dayAgo is a 6-day window)
      activeUsers7dAvg: Math.round(activeUsersLast7d / 6),
      openProposals,
      pendingReports,
    };
  });

  const c = counts ?? {
    signupsToday: 0,
    signupsYesterday: 0,
    activeUsers24h: 0,
    activeUsers7dAvg: 0,
    openProposals: 0,
    pendingReports: 0,
  };

  const signupDelta = pct(c.signupsToday, c.signupsYesterday);
  const activeDelta = pct(c.activeUsers24h, c.activeUsers7dAvg);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        label="오늘 신규 가입"
        value={c.signupsToday.toLocaleString()}
        deltaPercent={signupDelta}
        deltaLabel="어제 대비"
        icon={<UserPlus className="w-4 h-4" />}
      />
      <KpiTile
        label="활성 사용자 (24h)"
        value={c.activeUsers24h.toLocaleString()}
        deltaPercent={activeDelta}
        deltaLabel="지난 7일 평균 대비"
        icon={<Users className="w-4 h-4" />}
      />
      <KpiTile
        label="진행 중 거래"
        value={c.openProposals.toLocaleString()}
        hint={`오픈 상태 (${TetherProposalStatus.Open})`}
        icon={<ArrowRightLeft className="w-4 h-4" />}
      />
      <KpiTile
        label="신고 대기"
        value={c.pendingReports.toLocaleString()}
        hint="채팅 신고 누적"
        icon={<Inbox className="w-4 h-4" />}
      />
    </div>
  );
}
