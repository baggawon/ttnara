import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Repeat } from "lucide-react";

import { handleConnect } from "@/helpers/server/prisma";
import { now } from "@/helpers/basic";

const DAY_MS = 24 * 60 * 60 * 1000;
const HORIZONS = [1, 7, 30];

const HORIZON_META: Record<number, { label: string; color: string }> = {
  1: { label: "가입 다음날 복귀", color: "#10b981" },
  7: { label: "가입 1주 후 활동", color: "#0ea5e9" },
  30: { label: "가입 1개월 후 활동", color: "#8b5cf6" },
};

interface RetentionStat {
  day: number;
  eligible: number;
  retained: number;
  rate: number | null;
}

export async function RealRetentionCard() {
  const nowMs = now().valueOf();
  // Bound the cohort to the last 90 days of signups — recent cohorts are what
  // matter, and it keeps the scan small.
  const windowStart = now().subtract(90, "day").toDate();

  const stats = await handleConnect(async (prisma) => {
    const rows = await prisma.user.findMany({
      where: { created_at: { gte: windowStart } },
      select: { created_at: true, last_login: true },
    });

    return HORIZONS.map((day) => {
      const horizonMs = day * DAY_MS;
      // Eligible = the cohort has had the chance to reach day N.
      const eligible = rows.filter(
        (r) => r.created_at.getTime() <= nowMs - horizonMs
      );
      // Retained = most recent activity was at least N days after signup
      // (i.e. the user was still around on/after day N).
      const retained = eligible.filter(
        (r) =>
          r.last_login != null &&
          r.last_login.getTime() >= r.created_at.getTime() + horizonMs
      );
      return {
        day,
        eligible: eligible.length,
        retained: retained.length,
        rate:
          eligible.length > 0
            ? (retained.length / eligible.length) * 100
            : null,
      } satisfies RetentionStat;
    });
  });

  const list: RetentionStat[] =
    stats ??
    HORIZONS.map((day) => ({ day, eligible: 0, retained: 0, rate: null }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Repeat className="w-4 h-4" /> 리텐션
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          최근 90일 가입자 · 가입 후 N일 이후 활동 비율
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-5">
        {list.map((s) => {
          const meta = HORIZON_META[s.day];
          return (
            <div key={s.day} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold">D{s.day}</span>
                  <span className="text-xs text-muted-foreground">
                    {meta.label}
                  </span>
                </div>
                <span className="text-2xl font-bold tabular-nums">
                  {s.rate === null ? "-" : `${s.rate.toFixed(0)}%`}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.rate ?? 0}%`, background: meta.color }}
                />
              </div>
              <div className="text-right text-[11px] text-muted-foreground">
                {s.eligible === 0
                  ? "대상 코호트 없음"
                  : `${s.retained.toLocaleString()} / ${s.eligible.toLocaleString()}명 유지`}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
