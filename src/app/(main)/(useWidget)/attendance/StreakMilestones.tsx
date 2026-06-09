"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/components/lib/utils";
import { ChevronLeft, ChevronRight, Gift } from "lucide-react";
import type { AttendanceMilestone } from "@/app/api/attendance/read";

const PER_PAGE = 4;

type Cell = { kind: "real"; m: AttendanceMilestone } | { kind: "placeholder" };

/**
 * Streak-milestone strip rendered as a carousel that always shows 4 equal-size
 * cells per page. Real milestones and placeholders use the identical cell
 * layout, and the list is padded to a multiple of 4 so every page is full.
 * The cell whose day_count matches `cyclePosition` is highlighted.
 */
export default function StreakMilestones({
  milestones,
  cyclePosition,
}: {
  milestones: AttendanceMilestone[];
  cyclePosition: number;
}) {
  const cells: Cell[] = milestones.map((m) => ({ kind: "real", m }));
  const padTo = Math.max(
    PER_PAGE,
    Math.ceil(cells.length / PER_PAGE) * PER_PAGE
  );
  while (cells.length < padTo) cells.push({ kind: "placeholder" });

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: PER_PAGE,
    containScroll: "trimSnaps",
  });
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setPageCount(emblaApi.scrollSnapList().length);
    setSelected(emblaApi.selectedScrollSnap());
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

  // Re-measure when the milestone set changes (data loads asynchronously).
  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, milestones.length]);

  const multiPage = pageCount > 1;

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-3 p-0.5">
          {cells.map((cell, i) => (
            <div key={i} className="min-w-0 flex-[0_0_25%] pl-3">
              <StreakCell cell={cell} cyclePosition={cyclePosition} />
            </div>
          ))}
        </div>
      </div>

      {multiPage && (
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
          <div className="flex items-center gap-1.5">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}페이지`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === selected ? "w-4 bg-primary" : "w-1.5 bg-muted"
                )}
              />
            ))}
          </div>
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
}

function StreakCell({
  cell,
  cyclePosition,
}: {
  cell: Cell;
  cyclePosition: number;
}) {
  const base =
    "flex flex-col items-center justify-center gap-1 rounded-xl border p-4 text-center min-h-[96px]";

  if (cell.kind === "placeholder") {
    return (
      <div
        className={cn(
          base,
          "border-dashed border-border bg-muted/30 text-muted-foreground"
        )}
      >
        <Gift className="h-5 w-5 opacity-40" />
        <span className="text-xs">--</span>
      </div>
    );
  }

  const { m } = cell;
  const active = m.day_count === cyclePosition;
  return (
    <div
      className={cn(
        base,
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card"
      )}
    >
      <Gift
        className={cn(
          "h-5 w-5",
          active ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className="text-sm font-semibold">
        {m.label || `${m.day_count}일`}
      </span>
      <span
        className={cn(
          "text-sm font-bold",
          active ? "text-primary" : "text-foreground"
        )}
      >
        +{m.bonus_points}P
      </span>
    </div>
  );
}
