"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import {
  Flame,
  CalendarCheck,
  Coins,
  Wallet,
  Receipt,
  Send,
  Loader2,
} from "lucide-react";
import type { Session } from "next-auth";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { attendanceGet, sessionGet } from "@/helpers/get";
import { postJson } from "@/helpers/common";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import Link from "next/link";
import { ToastData } from "@/helpers/toastData";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/2_molecules/Input/FormInput";
import Form from "@/components/1_atoms/Form";
import { validateComment } from "@/helpers/validate";
import type {
  AttendanceReadProps,
  AttendanceReadResult,
} from "@/app/api/attendance/read";
import type {
  AttendanceCheckinProps,
  AttendanceCheckinResult,
} from "@/app/api/attendance/checkin";
import AttendanceCalendar from "./AttendanceCalendar";
import StreakMilestones from "./StreakMilestones";

const currentMonth = () => dayjs().format("YYYY-MM");

export default function AttendancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState<AttendanceReadProps>({
    month: currentMonth(),
    feedPage: 1,
  });

  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    { queryKey: [QueryKey.session] },
    sessionGet,
    undefined,
    { silent: true }
  );
  const isLoggedIn = !!session?.user;

  const { data } = useGetQuery<
    AttendanceReadResult | null,
    AttendanceReadProps
  >({ queryKey: [{ [QueryKey.attendance]: query }] }, attendanceGet, query, {
    silent: true,
  });

  const methods = useForm<{ comment: string }>({
    defaultValues: { comment: "" },
    reValidateMode: "onSubmit",
  });

  const checkinMutation = useMutation({
    mutationFn: async (props: AttendanceCheckinProps) => {
      const { isSuccess, hasMessage, hasData } =
        await postJson<AttendanceCheckinProps>(
          ApiRoute.attendanceCheckin,
          props
        );
      if (isSuccess) {
        const result = hasData as AttendanceCheckinResult;
        toast({
          id: `출석 완료! +${result.awarded}P${
            result.milestoneHit ? " (연속 보너스 포함)" : ""
          }`,
          type: "success",
        });
        methods.reset({ comment: "" });
        // Force an immediate refetch of every attendance read query (calendar,
        // stats, feed) so the UI reflects the new check-in without a reload.
        // refetchType "all" covers active + cached months.
        await queryClient.invalidateQueries({
          predicate: (q) =>
            JSON.stringify(q.queryKey).includes(`"${QueryKey.attendance}":`),
          refetchType: "all",
        });
      } else if (hasMessage) {
        toast({ id: hasMessage, type: "error" });
      }
    },
    onError: () => toast({ id: ToastData.unknown, type: "error" }),
  });

  const submitCheckin = (form: { comment: string }) => {
    if (checkinMutation.isPending) return;
    checkinMutation.mutate({ comment: form.comment, comment_format: "html" });
  };

  const stats = data?.stats;
  const enabled = data?.setting.is_enabled ?? true;
  const checkedToday = stats?.checkedToday ?? false;
  const feed = data?.feed;

  return (
    <section className="w-full flex flex-col gap-4 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">출석체크</h1>
        <p className="text-sm text-muted-foreground">
          매일 출석하고 포인트를 받아보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {/* Left pane: calendar and streak milestones share one card. */}
        <Card className="h-full">
          <CardContent className="flex flex-col gap-4 pt-6">
            <AttendanceCalendar
              month={query.month ?? currentMonth()}
              checkedDates={data?.monthDates ?? []}
              onMonthChange={(ym) => setQuery((q) => ({ ...q, month: ym }))}
            />
            <div className="flex flex-col gap-3 border-t pt-4">
              <h2 className="text-base font-semibold">연속 출석 보너스</h2>
              <StreakMilestones
                milestones={data?.milestones ?? []}
                cyclePosition={stats?.cyclePosition ?? 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right pane: attendance stats — one card, divided rows, matched height. */}
        <Card className="h-full">
          <CardContent className="flex h-full flex-col divide-y p-0">
            <StatRow
              icon={<Flame className="h-5 w-5 text-orange-500" />}
              label="연속 출석"
              value={`${stats?.consecutiveDays ?? 0}일`}
            />
            <StatRow
              icon={<CalendarCheck className="h-5 w-5 text-blue-500" />}
              label="이번 달 출석"
              value={`${stats?.monthCount ?? 0}일`}
            />
            <StatRow
              icon={<Wallet className="h-5 w-5 text-emerald-500" />}
              label="누적 획득"
              hint="출석으로 획득한 포인트"
              value={`${(stats?.lifetimeEarned ?? 0).toLocaleString()}P`}
            />
            <StatRow
              icon={<Coins className="h-5 w-5 text-amber-500" />}
              label="오늘 보상"
              value={checkedToday ? `+${stats?.todayAwarded ?? 0}P` : "-"}
            />
            <div className="p-4">
              <Link href={AppRoute.PointSetting} className="block">
                <Button type="button" variant="outline" className="w-full">
                  <Receipt className="mr-1 h-4 w-4" />
                  포인트 내역 보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check-in comment box */}
      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          <h2 className="text-base font-semibold">출석 한마디</h2>
          {!enabled ? (
            <p className="text-sm text-muted-foreground">
              현재 출석체크가 비활성화되어 있습니다.
            </p>
          ) : !isLoggedIn ? (
            <p className="text-sm text-muted-foreground">
              출석체크를 하려면 로그인이 필요합니다.
            </p>
          ) : checkedToday ? (
            <p className="text-sm font-medium text-primary">
              오늘 출석 완료! 내일 또 만나요 👋
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                댓글을 입력해야 출석체크가 완료됩니다.
              </p>
              <FormProvider {...methods}>
                <Form onSubmit={submitCheckin} className="w-full">
                  <div className="flex items-center gap-2">
                    <Input
                      name="comment"
                      validate={validateComment}
                      placeholder="오늘의 한마디를 입력하세요"
                      className="flex-1"
                      maxLength={500}
                      isErrorVislble={false}
                    />
                    <Button type="submit" disabled={checkinMutation.isPending}>
                      {checkinMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      출석
                    </Button>
                  </div>
                </Form>
              </FormProvider>
            </>
          )}
        </CardContent>
      </Card>

      {/* Public feed */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="text-base font-semibold">출석 한마디 피드</h2>
          {feed && feed.items.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-lg bg-muted/30">
              {feed.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 px-3 py-2">
                  {/* Fixed-width author column so every comment's content
                      starts at the same x regardless of nickname length. */}
                  <div className="flex w-[110px] shrink-0 flex-col gap-0.5 sm:w-[150px]">
                    <span className="flex min-w-0 items-center gap-1">
                      {item.rank_image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.rank_image}
                          alt=""
                          className="h-4 w-4 shrink-0 object-contain"
                        />
                      )}
                      <span className="min-w-0 truncate text-xs font-semibold text-foreground">
                        {item.displayname || "익명"}
                      </span>
                    </span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {dayjs(item.created_at)
                        .tz("Asia/Seoul")
                        .format("MM-DD HH:mm")}
                    </span>
                  </div>
                  {/* Check-in comments are plain, single-line, and already
                      sanitized server-side — render like a board comment
                      (no heavy rich-content viewer). */}
                  <div
                    className="min-w-0 flex-1 break-words pt-0.5 text-sm [&>p]:m-0"
                    dangerouslySetInnerHTML={{ __html: item.comment }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              아직 출석 한마디가 없습니다.
            </p>
          )}

          {feed && feed.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={feed.currentPage <= 1}
                onClick={() =>
                  setQuery((q) => ({
                    ...q,
                    feedPage: Math.max(1, (q.feedPage ?? 1) - 1),
                  }))
                }
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {feed.currentPage} / {feed.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={feed.currentPage >= feed.totalPages}
                onClick={() =>
                  setQuery((q) => ({ ...q, feedPage: (q.feedPage ?? 1) + 1 }))
                }
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function StatRow({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-between gap-3 px-6 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{label}</span>
          {hint && (
            <span className="text-xs text-muted-foreground/70">{hint}</span>
          )}
        </div>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
