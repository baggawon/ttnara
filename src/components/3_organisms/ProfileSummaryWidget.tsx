"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { User, CalendarCheck, ChevronRight } from "lucide-react";

import { cn } from "@/components/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { BoardRankIcon } from "@/components/1_atoms/BoardRankIcon";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { sessionGet, profileSummaryGet } from "@/helpers/get";
import { AppRoute, QueryKey } from "@/helpers/types";
import type { ProfileSummaryResponse } from "@/app/api/profile/summary";

export default function ProfileSummaryWidget() {
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    { queryKey: [QueryKey.session] },
    sessionGet,
    undefined,
    { silent: true }
  );
  const isLoggedIn = !!session?.user;

  const { data } = useGetQuery<ProfileSummaryResponse | null, undefined>(
    { queryKey: [QueryKey.profileSummary], enabled: isLoggedIn },
    profileSummaryGet,
    undefined,
    { silent: true }
  );

  // Guests (or before the summary loads) get no widget.
  if (!isLoggedIn || !data) return null;

  const { displayname, boardRank, postCount, point, attendance } = data;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-bold">{displayname}</span>
            <BoardRankIcon
              profile={{
                current_board_rank_level: boardRank.level,
                current_board_rank_name: boardRank.name,
                current_board_rank_image: boardRank.image,
              }}
              className="w-5"
            />
          </div>
        </div>

        {/* Board rank progress */}
        {boardRank.configured ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                {boardRank.name ?? `Lv.${boardRank.level}`}
              </span>
              <span className="text-muted-foreground">
                {boardRank.isMax ? "MAX" : `${boardRank.progress}%`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${boardRank.isMax ? 100 : boardRank.progress}%`,
                }}
              />
            </div>
          </div>
        ) : (
          // No board ranks configured yet — neutral placeholder bar.
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">등급 미설정</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-0" />
            </div>
          </div>
        )}

        {/* Board stats (댓글 intentionally omitted) */}
        <div className="grid grid-cols-2 gap-2">
          <StatCell label="게시글" value={`${postCount.toLocaleString()}건`} />
          <StatCell
            label="포인트"
            value={`${point.toLocaleString()}P`}
            href={AppRoute.PointSetting}
          />
        </div>

        {/* Attendance entry point — hidden when attendance is disabled in admin */}
        {attendance.enabled && (
          <Link href={AppRoute.Attendance} className="block">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-3 transition hover:bg-primary/10">
              <div className="flex min-w-0 items-center gap-2">
                <CalendarCheck className="h-5 w-5 shrink-0 text-primary" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold">출석체크</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {attendance.checkedToday
                      ? "오늘 출석 완료"
                      : "오늘 출석 체크하기"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                  {attendance.checkedToday ? "완료" : "출석"}
                </span>
                {!attendance.checkedToday && attendance.dailyPoints > 0 && (
                  <span className="text-xs font-bold text-primary">
                    +{attendance.dailyPoints}P
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function StatCell({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const base =
    "relative flex flex-col items-center justify-center gap-0.5 rounded-lg border bg-card px-2 py-3 text-center";
  const inner = (
    <>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-base font-bold">{value}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "transition hover:border-primary/50 hover:bg-accent"
        )}
      >
        <ChevronRight className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
        {inner}
      </Link>
    );
  }

  return <div className={base}>{inner}</div>;
}
