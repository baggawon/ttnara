"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/components/lib/utils";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { pointHistoryGet } from "@/helpers/get";
import { QueryKey } from "@/helpers/types";
import {
  PointKind,
  pointActionLabel,
  pointKindLabel,
} from "@/helpers/pointSystem";
import type {
  PointHistoryReadProps,
  PointHistoryResponse,
} from "@/app/api/point/history";

const KIND_FILTERS: { value: PointHistoryReadProps["kind"]; label: string }[] =
  [
    { value: "all", label: "전체" },
    { value: PointKind.earn, label: "적립" },
    { value: PointKind.spend, label: "사용" },
    { value: PointKind.refund, label: "회수" },
    { value: PointKind.adjust, label: "조정" },
  ];

const PAGE_SIZE = 20;

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
};

const kindStyle = (kind: string) => {
  switch (kind) {
    case PointKind.earn:
      return "text-emerald-700 dark:text-emerald-400";
    case PointKind.spend:
      return "text-rose-700 dark:text-rose-400";
    case PointKind.refund:
      return "text-amber-700 dark:text-amber-400";
    case PointKind.adjust:
      return "text-sky-700 dark:text-sky-400";
    default:
      return "text-muted-foreground";
  }
};

export default function Page() {
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<PointHistoryReadProps["kind"]>("all");

  const query: PointHistoryReadProps = {
    page,
    pageSize: PAGE_SIZE,
    kind,
  };

  const { data } = useGetQuery<
    PointHistoryResponse | null,
    PointHistoryReadProps
  >(
    { queryKey: [{ [QueryKey.pointHistory]: query }] },
    pointHistoryGet,
    query,
    { silent: true }
  );

  const summary = data?.summary;
  const rows = data?.history ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden border-none shadow-md">
        <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-emerald-50 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-emerald-950/30">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="w-4 h-4" />
              <span>보유 포인트</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                {(summary?.balance ?? 0).toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground">P</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryStat
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="이번 달 적립"
                value={summary?.monthEarn ?? 0}
                tone="earn"
              />
              <SummaryStat
                icon={<TrendingDown className="w-3.5 h-3.5" />}
                label="이번 달 사용"
                value={summary?.monthSpend ?? 0}
                tone="spend"
              />
              <SummaryStat
                icon={<Coins className="w-3.5 h-3.5" />}
                label="누적 적립"
                value={summary?.lifetimeEarn ?? 0}
                tone="muted"
              />
              <SummaryStat
                icon={<Coins className="w-3.5 h-3.5" />}
                label="누적 사용"
                value={summary?.lifetimeSpend ?? 0}
                tone="muted"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            포인트 내역
          </CardTitle>
          <CardDescription>
            적립, 사용, 회수, 조정 내역을 확인할 수 있습니다.
          </CardDescription>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {KIND_FILTERS.map((f) => (
              <Button
                key={f.value}
                type="button"
                size="sm"
                variant={kind === f.value ? "default" : "outline"}
                onClick={() => {
                  setKind(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              표시할 내역이 없습니다.
            </div>
          ) : (
            <ul className="divide-y">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start gap-3 px-4 py-3 sm:px-6"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">
                        {pointKindLabel(row.kind)}
                      </Badge>
                      <span className="text-sm font-medium truncate">
                        {pointActionLabel(row.action)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{formatDate(row.created_at)}</span>
                      {row.thread_id && (
                        <Link
                          href={`/board/tether/${row.thread_id}`}
                          className="hover:underline"
                        >
                          게시글 #{row.thread_id}
                        </Link>
                      )}
                      {row.note && <span className="truncate">{row.note}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        kindStyle(row.kind),
                        row.amount > 0 ? "" : ""
                      )}
                    >
                      {row.amount > 0 ? "+" : ""}
                      {row.amount.toLocaleString()} P
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      잔액 {row.balance.toLocaleString()} P
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t px-4 py-3 sm:px-6">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const SummaryStat = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "earn" | "spend" | "muted";
}) => (
  <div className="rounded-md bg-background/70 backdrop-blur px-3 py-2">
    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div
      className={cn(
        "mt-0.5 text-sm font-bold tabular-nums",
        tone === "earn" && "text-emerald-700 dark:text-emerald-400",
        tone === "spend" && "text-rose-700 dark:text-rose-400",
        tone === "muted" && "text-foreground"
      )}
    >
      {value.toLocaleString()} P
    </div>
  </div>
);
