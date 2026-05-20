"use client";

import { RankBadge } from "./rank/RankBadge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/components/lib/utils";

interface UserStatsBadgeProps {
  rank_level: number;
  rank_image: string;
  rank_name: string;
  point: number;
  ranking_total: number;
  ranking_weekly: number;
  ranking_daily: number;
  className?: string;
  variant?: "compact" | "expanded";
}

export const UserStatsBadge = ({
  rank_level,
  rank_image,
  rank_name,
  point,
  ranking_total,
  ranking_weekly,
  ranking_daily,
  className,
  variant = "compact",
}: UserStatsBadgeProps) => {
  const expanded = variant === "expanded";

  return (
    <div
      className={cn(
        "flex items-center rounded-md border bg-muted/50 text-[11px] leading-none",
        expanded ? "h-8 w-full" : "h-8",
        className
      )}
    >
      {/* Rank section */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1 px-1.5 h-full border-r cursor-default",
                expanded && "flex-1 justify-center"
              )}
            >
              <RankBadge badgeName={rank_image} className="!w-4 !h-4" />
              <span className="font-medium text-muted-foreground">
                {rank_level}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{rank_name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Point section */}
      <div
        className={cn(
          "flex items-center gap-0.5 px-1.5 h-full border-r",
          expanded && "flex-1 justify-center"
        )}
      >
        <span className="font-bold text-amber-600 dark:text-amber-400">P</span>
        <span className="font-medium tabular-nums text-amber-600 dark:text-amber-400">
          {point.toLocaleString()}
        </span>
      </div>

      {/* Ranking score section with popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-0.5 px-1.5 h-full rounded-r-md hover:bg-muted transition-colors cursor-pointer",
              expanded && "flex-1 justify-center"
            )}
          >
            <span className="font-bold text-blue-600 dark:text-blue-400">
              R
            </span>
            <span className="font-medium tabular-nums text-blue-600 dark:text-blue-400">
              {ranking_total.toFixed(1)}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[150px] p-3">
          <div className="text-xs text-muted-foreground mb-2">랭킹 점수</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">전체</span>
              <span className="font-medium tabular-nums">
                {ranking_total.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">주간</span>
              <span className="font-medium tabular-nums">
                {ranking_weekly.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">일간</span>
              <span className="font-medium tabular-nums">
                {ranking_daily.toFixed(1)}
              </span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
