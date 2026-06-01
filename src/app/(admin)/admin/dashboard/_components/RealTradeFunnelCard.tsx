import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock3, Timer } from "lucide-react";

import { handleConnect } from "@/helpers/server/prisma";
import { now } from "@/helpers/basic";
import { TetherProposalStatus } from "@/helpers/types";

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}분`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}시간`;
  return `${(hours / 24).toFixed(1)}일`;
}

export async function RealTradeFunnelCard() {
  const thirtyDaysAgo = now().subtract(30, "day").startOf("day").toDate();

  const stats = await handleConnect(async (prisma) => {
    const [grouped, completedRecent] = await Promise.all([
      prisma.tether_proposal.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      // Recent completed proposals, for median time-to-complete. updated_at is
      // set when the proposal transitions to "complete".
      prisma.tether_proposal.findMany({
        where: {
          status: TetherProposalStatus.Complete,
          updated_at: { gte: thirtyDaysAgo },
        },
        select: { created_at: true, updated_at: true },
      }),
    ]);

    const countByStatus = new Map(
      grouped.map((g) => [g.status, g._count._all])
    );
    const complete = countByStatus.get(TetherProposalStatus.Complete) ?? 0;
    const cancel = countByStatus.get(TetherProposalStatus.Cancel) ?? 0;
    const open = countByStatus.get(TetherProposalStatus.Open) ?? 0;
    const resolved = complete + cancel;

    // Median duration, robust to outliers vs a mean.
    const durations = completedRecent
      .map((p) => p.updated_at.getTime() - p.created_at.getTime())
      .filter((ms) => ms >= 0)
      .sort((a, b) => a - b);
    let medianMs: number | null = null;
    if (durations.length > 0) {
      const mid = Math.floor(durations.length / 2);
      medianMs =
        durations.length % 2 === 0
          ? (durations[mid - 1] + durations[mid]) / 2
          : durations[mid];
    }

    return {
      complete,
      cancel,
      open,
      completionRate: resolved > 0 ? (complete / resolved) * 100 : null,
      cancellationRate: resolved > 0 ? (cancel / resolved) * 100 : null,
      medianMs,
      medianSample: durations.length,
    };
  });

  const s = stats ?? {
    complete: 0,
    cancel: 0,
    open: 0,
    completionRate: null,
    cancellationRate: null,
    medianMs: null,
    medianSample: 0,
  };

  const total = s.complete + s.cancel + s.open;
  const bar = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">거래 퍼널</CardTitle>
        <p className="text-xs text-muted-foreground">누적 거래 제안 상태</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked status bar */}
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-emerald-500"
            style={{ width: `${bar(s.complete)}%` }}
          />
          <div className="bg-sky-500" style={{ width: `${bar(s.open)}%` }} />
          <div className="bg-red-400" style={{ width: `${bar(s.cancel)}%` }} />
        </div>

        <ul className="text-sm space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="flex-1">완료</span>
            <span className="font-medium">{s.complete.toLocaleString()}</span>
          </li>
          <li className="flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="flex-1">진행중</span>
            <span className="font-medium">{s.open.toLocaleString()}</span>
          </li>
          <li className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">취소</span>
            <span className="font-medium">{s.cancel.toLocaleString()}</span>
          </li>
        </ul>

        <div className="grid grid-cols-2 gap-2 border-t pt-3">
          <div>
            <div className="text-xs text-muted-foreground">완료율</div>
            <div className="text-lg font-bold">
              {s.completionRate === null
                ? "-"
                : `${s.completionRate.toFixed(1)}%`}
            </div>
            <div className="text-[10px] text-muted-foreground">
              완료 / (완료+취소)
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Timer className="w-3 h-3" /> 중간 완료 시간
            </div>
            <div className="text-lg font-bold">
              {s.medianMs === null ? "-" : formatDuration(s.medianMs)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              최근 30일 · {s.medianSample}건
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
