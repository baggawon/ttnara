"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/components/lib/utils";
import { RankBadge } from "@/components/1_atoms/rank/RankBadge";
import type { RankView, RankViewItem } from "@/app/api/rank/summary";

export function RankProgression({
  view,
  displayname,
}: {
  view: RankView;
  displayname: string;
}) {
  const { ranks, current, unitLabel } = view;
  const value = current.value;

  const currentRank =
    [...ranks].reverse().find((r) => value >= r.min_value) ?? ranks[0];
  const nextRank = ranks.find((r) => r.min_value > value);

  const isMaxRank = !nextRank;
  const remainingToNext = nextRank
    ? Math.max(0, nextRank.min_value - value)
    : 0;

  // Segment progress: how far through the CURRENT rank's band, toward the
  // next rank only. Scales identically for 5 ranks or 50 — never spans the
  // whole ladder.
  const currentMin = currentRank?.min_value ?? 0;
  const segmentPercent = isMaxRank
    ? 100
    : nextRank!.min_value > currentMin
      ? Math.min(
          100,
          Math.max(
            0,
            ((value - currentMin) / (nextRank!.min_value - currentMin)) * 100
          )
        )
      : 100;

  const currentIndex = currentRank
    ? ranks.findIndex((r) => r.rank_level === currentRank.rank_level)
    : -1;
  const endBadge = nextRank ?? currentRank;

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden border-none shadow-md">
        <div className="bg-gradient-to-br from-emerald-100 via-amber-50 to-sky-50 dark:from-emerald-950/40 dark:via-amber-900/20 dark:to-sky-950/30">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>
                {displayname ? `${displayname}님 ` : ""}
                {view.heroLabel}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {value.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground">{unitLabel}</span>
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
                  : `· 다음 등급까지 ${remainingToNext.toLocaleString()}${unitLabel} 남음`}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {view.statsTitle}
          </CardTitle>
          <CardDescription>{view.statsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {view.stats.map((s, i) => (
            <StatCell
              key={s.label}
              label={s.label}
              value={s.value}
              unit={s.unit}
              index={i}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            등급 진행도
          </CardTitle>
          <CardDescription>{view.progressDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 mt-4">
          {ranks.length > 0 && currentRank && (
            <div className="px-2 sm:px-4">
              {/* Bar spans full width with side padding so the value pill
                  never clips at the edges. Endpoints sit below, centered. */}
              <div className="px-3">
                <div className="relative h-2 bg-muted rounded-full">
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${segmentPercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all"
                    style={{ left: `${segmentPercent}%` }}
                  >
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-600 shadow" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums shadow">
                      {value.toLocaleString()}
                      {unitLabel}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-between">
                <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <RankIcon badge={currentRank.badge_image} />
                  <span className="font-medium text-foreground">
                    {currentRank.name ?? `등급 ${currentRank.rank_level}`}
                  </span>
                  <span className="tabular-nums">
                    {currentRank.min_value.toLocaleString()}
                    {unitLabel}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <RankIcon
                    badge={endBadge?.badge_image ?? null}
                    className={isMaxRank ? "" : "opacity-60"}
                  />
                  <span>
                    {isMaxRank
                      ? "최고 등급"
                      : (nextRank!.name ?? `등급 ${nextRank!.rank_level}`)}
                  </span>
                  {!isMaxRank && (
                    <span className="tabular-nums">
                      {nextRank!.min_value.toLocaleString()}
                      {unitLabel}
                    </span>
                  )}
                </div>
              </div>
              {currentIndex >= 0 && (
                <div className="mt-3 text-center text-xs text-muted-foreground tabular-nums">
                  현재 {currentIndex + 1} / 전체 {ranks.length} 등급
                </div>
              )}
            </div>
          )}

          {ranks.length > 0 && (
            <RankLadder
              ranks={ranks}
              value={value}
              currentLevel={currentRank?.rank_level ?? null}
              unitLabel={unitLabel}
            />
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

// Draggable rank strip (embla) that auto-centers on the current rank. Fits
// without dragging for a handful of ranks; drags freely for many.
const RankLadder = ({
  ranks,
  value,
  currentLevel,
  unitLabel,
}: {
  ranks: RankViewItem[];
  value: number;
  currentLevel: number | null;
  unitLabel: string;
}) => {
  const currentIndex = ranks.findIndex((r) => r.rank_level === currentLevel);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sync();
    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    return () => {
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi, sync]);

  // Re-measure when the rank set changes (tab switch / async load) and center
  // the current rank without animation.
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    if (currentIndex >= 0) emblaApi.scrollTo(currentIndex, true);
    sync();
  }, [emblaApi, ranks.length, currentIndex, sync]);

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-3 p-0.5 select-none">
          {ranks.map((r) => {
            const achieved = value >= r.min_value;
            const isCurrent = r.rank_level === currentLevel;
            return (
              <div key={r.rank_level} className="flex-[0_0_auto] pl-3">
                <div
                  className={cn(
                    "flex w-24 flex-col items-center gap-1.5 rounded-md border p-2 transition-colors",
                    isCurrent &&
                      "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10",
                    !achieved && "opacity-50"
                  )}
                >
                  <RankIcon badge={r.badge_image} />
                  <span className="text-xs font-medium text-center truncate w-full">
                    {r.name ?? `등급 ${r.rank_level}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {r.min_value.toLocaleString()}
                    {unitLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(canPrev || canNext) && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="이전"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            className="flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground transition hover:bg-accent disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="다음"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            className="flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground transition hover:bg-accent disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Rank badge, or a uniform placeholder when no icon is assigned, so cells and
// bar endpoints keep a consistent height.
const RankIcon = ({
  badge,
  className,
}: {
  badge: string | null;
  className?: string;
}) =>
  badge ? (
    <RankBadge badgeName={badge} className={cn("!w-8 !h-8", className)} />
  ) : (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border border-dashed text-muted-foreground/40",
        className
      )}
    >
      <Trophy className="h-4 w-4" />
    </div>
  );

const StatCell = ({
  label,
  value,
  unit,
  index,
}: {
  label: string;
  value: number;
  unit: string;
  index: number;
}) => (
  <div className="rounded-md border bg-background p-3 sm:p-4">
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="truncate">{label}</span>
    </div>
    <div className="mt-1 flex items-baseline gap-1">
      <span
        className={cn(
          "text-2xl font-bold tabular-nums",
          index === 0 && "text-rose-600 dark:text-rose-400",
          index === 1 && "text-sky-600 dark:text-sky-400",
          index >= 2 && "text-foreground"
        )}
      >
        {value.toLocaleString()}
      </span>
      <span className="text-sm text-muted-foreground">{unit}</span>
    </div>
  </div>
);
