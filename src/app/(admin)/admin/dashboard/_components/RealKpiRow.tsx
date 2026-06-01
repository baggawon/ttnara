import {
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  Inbox,
  UserPlus,
  Users,
} from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { handleConnect } from "@/helpers/server/prisma";
import { now } from "@/helpers/basic";
import { TetherProposalStatus } from "@/helpers/types";

interface KpiItem {
  label: string;
  value: string;
  icon: ReactNode;
  deltaPercent?: number;
  deltaLabel?: string;
  hint?: string;
}

const pct = (curr: number, base: number): number | undefined => {
  if (base === 0) return curr === 0 ? 0 : undefined;
  return ((curr - base) / base) * 100;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function RealKpiRow() {
  const today = now().startOf("day").toDate();
  const yesterday = now().subtract(1, "day").startOf("day").toDate();
  // Start of the 7 full calendar days before today, used to average DAU.
  const sevenDaysAgo = now().subtract(7, "day").startOf("day").toDate();
  const dayAgo = now().subtract(1, "day").toDate();

  const counts = await handleConnect(async (prisma) => {
    const [
      signupsToday,
      signupsYesterday,
      activeUsers24h,
      login7dRows,
      openProposals,
      reportedMessageIds,
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
      // All logins across the 7 full days before today; we bucket these by
      // calendar day and average the per-day distinct counts (true DAU).
      prisma.login_history.findMany({
        where: { created_at: { gte: sevenDaysAgo, lt: today } },
        select: { uid: true, created_at: true },
      }),
      prisma.tether_proposal.count({
        where: { status: TetherProposalStatus.Open },
      }),
      // Distinct messages that have been reported (a message may have many
      // reports). Pending = those still visible (not hidden / not deleted).
      prisma.chat_report.findMany({
        select: { message_id: true },
        distinct: ["message_id"],
      }),
    ]);

    // True average DAU: distinct users per calendar day, averaged over 7 days
    // (days with no logins count as 0, which is correct for an average).
    const startMs = sevenDaysAgo.getTime();
    const dailyUsers: Array<Set<string>> = Array.from(
      { length: 7 },
      () => new Set<string>()
    );
    for (const row of login7dRows) {
      const idx = Math.floor((row.created_at.getTime() - startMs) / DAY_MS);
      if (idx >= 0 && idx < 7) dailyUsers[idx].add(row.uid);
    }
    const activeUsers7dAvg = Math.round(
      dailyUsers.reduce((sum, set) => sum + set.size, 0) / 7
    );

    // Pending = reported messages that are still visible. Hidden or deleted
    // messages are treated as handled (moderation has no resolve action yet).
    const ids = reportedMessageIds.map((r) => r.message_id);
    const pendingReports =
      ids.length === 0
        ? 0
        : await prisma.chat_message.count({
            where: { id: { in: ids }, is_hidden: false },
          });

    return {
      signupsToday,
      signupsYesterday,
      activeUsers24h,
      activeUsers7dAvg,
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

  const items: KpiItem[] = [
    {
      label: "오늘 신규 가입",
      value: c.signupsToday.toLocaleString(),
      deltaPercent: pct(c.signupsToday, c.signupsYesterday),
      deltaLabel: "어제 대비",
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      label: "활성 사용자 (24h)",
      value: c.activeUsers24h.toLocaleString(),
      deltaPercent: pct(c.activeUsers24h, c.activeUsers7dAvg),
      deltaLabel: "지난 7일 평균 대비",
      icon: <Users className="w-4 h-4" />,
    },
    {
      label: "진행 중 거래",
      value: c.openProposals.toLocaleString(),
      hint: `오픈 상태 (${TetherProposalStatus.Open})`,
      icon: <ArrowRightLeft className="w-4 h-4" />,
    },
    {
      label: "신고 대기",
      value: c.pendingReports.toLocaleString(),
      hint: "미처리 신고 (메시지 미숨김)",
      icon: <Inbox className="w-4 h-4" />,
    },
  ];

  return (
    <Card className="p-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const showDelta = item.deltaPercent !== undefined;
          const isUp = (item.deltaPercent ?? 0) >= 0;
          return (
            <div
              key={item.label}
              className="space-y-1 rounded-lg bg-muted/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-muted-foreground">{item.icon}</span>
              </div>
              <div className="text-2xl font-bold">{item.value}</div>
              {showDelta && (
                <div
                  className={clsx(
                    "inline-flex items-center gap-0.5 text-xs",
                    isUp ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {isUp ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(item.deltaPercent!).toFixed(1)}%
                  {item.deltaLabel && (
                    <span className="ml-1 text-muted-foreground">
                      {item.deltaLabel}
                    </span>
                  )}
                </div>
              )}
              {item.hint && (
                <div className="text-xs text-muted-foreground">{item.hint}</div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
