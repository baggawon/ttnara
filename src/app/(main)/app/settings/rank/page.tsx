"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trophy,
  Calendar,
  CalendarDays,
  CalendarRange,
  Sparkles,
} from "lucide-react";
import { cn } from "@/components/lib/utils";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { rankSummaryGet } from "@/helpers/get";
import { QueryKey } from "@/helpers/types";
import type { RankSummaryResponse } from "@/app/api/rank/summary";
import { RankBadge } from "@/components/1_atoms/rank/RankBadge";

export default function Page() {
  const { data } = useGetQuery<RankSummaryResponse | null, undefined>(
    { queryKey: [QueryKey.rankSummary] },
    rankSummaryGet
  );

  const ranks = data?.ranks ?? [];
  const user = data?.user;
  const periodCounts = data?.periodCounts;
  const tradeCount = user?.trade_count ?? 0;
  const displayname = user?.displayname ?? "";

  const currentRank =
    [...ranks].reverse().find((r) => tradeCount >= r.min_trade_count) ??
    ranks[0];
  const nextRank = ranks.find((r) => r.min_trade_count > tradeCount);

  const maxRank = ranks[ranks.length - 1];
  const isMaxRank = !nextRank;
  const remainingToNext = nextRank
    ? Math.max(0, nextRank.min_trade_count - tradeCount)
    : 0;

  const trackStart = currentRank?.min_trade_count ?? 0;
  const trackEnd = Math.max(
    trackStart + 1,
    maxRank?.min_trade_count ?? trackStart + 1
  );
  const trackSpan = trackEnd - trackStart;
  const fillPercent = isMaxRank
    ? 100
    : Math.min(100, Math.max(0, ((tradeCount - trackStart) / trackSpan) * 100));

  const intermediateRanks = ranks.filter(
    (r) => r.min_trade_count > trackStart && r.min_trade_count < trackEnd
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden border-none shadow-md">
        <div className="bg-gradient-to-br from-emerald-100 via-amber-50 to-sky-50 dark:from-emerald-950/40 dark:via-amber-900/20 dark:to-sky-950/30">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>{displayname ? `${displayname}님 ` : ""}총 거래횟수</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {tradeCount.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground">회</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {currentRank?.badge_image && (
                <RankBadge
                  badgeName={currentRank.badge_image}
                  className="!w-5 !h-5"
                />
              )}
              <span className="font-medium">
                {currentRank?.name ?? "등급 없음"}
              </span>
              <span className="text-muted-foreground">
                {isMaxRank
                  ? "· 최고 등급 달성"
                  : `· 다음 등급까지 ${remainingToNext.toLocaleString()}회 남음`}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            기간별 거래 횟수
          </CardTitle>
          <CardDescription>
            최근 기간 동안 완료한 거래 횟수입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PeriodStat
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="금일 거래 횟수"
            value={periodCounts?.today ?? 0}
            tone="today"
          />
          <PeriodStat
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label="최근 1주일 거래 횟수"
            value={periodCounts?.week ?? 0}
            tone="week"
          />
          <PeriodStat
            icon={<CalendarRange className="w-3.5 h-3.5" />}
            label="최근 1개월 거래 횟수"
            value={periodCounts?.month ?? 0}
            tone="month"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            등급 진행도
          </CardTitle>
          <CardDescription>
            거래 횟수 조건을 달성 시 자동 등업됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {ranks.length > 0 && (
            <div className="px-2 sm:px-4">
              <div className="flex items-center gap-3">
                {currentRank?.badge_image && (
                  <RankBadge
                    badgeName={currentRank.badge_image}
                    className="!w-8 !h-8 shrink-0"
                  />
                )}
                <div className="relative flex-1 h-2 bg-muted rounded-full">
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${fillPercent}%` }}
                  />
                  {intermediateRanks.map((r) => {
                    const left =
                      ((r.min_trade_count - trackStart) / trackSpan) * 100;
                    return (
                      <div
                        key={r.rank_level}
                        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-foreground/30"
                        style={{ left: `${left}%` }}
                      />
                    );
                  })}
                </div>
                {maxRank?.badge_image && (
                  <RankBadge
                    badgeName={maxRank.badge_image}
                    className="!w-8 !h-8 shrink-0"
                  />
                )}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{trackStart.toLocaleString()}</span>
                {intermediateRanks.map((r) => (
                  <span key={r.rank_level}>
                    {r.min_trade_count.toLocaleString()}
                  </span>
                ))}
                <span>{trackEnd.toLocaleString()}</span>
              </div>
            </div>
          )}

          {ranks.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
              {ranks.map((r) => {
                const achieved = tradeCount >= r.min_trade_count;
                const isCurrent = currentRank?.rank_level === r.rank_level;
                return (
                  <div
                    key={r.rank_level}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-md border p-2 transition-colors",
                      isCurrent &&
                        "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10",
                      !achieved && "opacity-50"
                    )}
                  >
                    {r.badge_image && (
                      <RankBadge
                        badgeName={r.badge_image}
                        className="!w-8 !h-8"
                      />
                    )}
                    <span className="text-xs font-medium text-center truncate w-full">
                      {r.name ?? `등급 ${r.rank_level}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {r.min_trade_count.toLocaleString()}회
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {ranks.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              등급 정보를 불러올 수 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const PeriodStat = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "today" | "week" | "month";
}) => (
  <div className="rounded-md border bg-background p-3 sm:p-4">
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <div className="mt-1 flex items-baseline gap-1">
      <span
        className={cn(
          "text-2xl font-bold tabular-nums",
          tone === "today" && "text-rose-600 dark:text-rose-400",
          tone === "week" && "text-sky-600 dark:text-sky-400",
          tone === "month" && "text-foreground"
        )}
      >
        {value.toLocaleString()}
      </span>
      <span className="text-sm text-muted-foreground">회</span>
    </div>
  </div>
);
