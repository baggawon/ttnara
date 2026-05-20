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
import { Activity } from "lucide-react";
import { cn } from "@/components/lib/utils";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { boardActivityGet } from "@/helpers/get";
import { QueryKey } from "@/helpers/types";
import {
  BoardActivityAction,
  boardActivityLabel,
} from "@/helpers/boardActivity";
import type {
  BoardActivityReadProps,
  BoardActivityResponse,
} from "@/app/api/board/activity";

const FILTERS: { value: BoardActivityReadProps["action"]; label: string }[] = [
  { value: "all", label: "전체" },
  { value: BoardActivityAction.post_create, label: "게시글 작성" },
  { value: BoardActivityAction.post_read, label: "게시글 조회" },
  { value: BoardActivityAction.comment_create, label: "댓글 작성" },
  { value: BoardActivityAction.upvote, label: "추천" },
  { value: BoardActivityAction.downvote, label: "비추천" },
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

const actionTone = (action: string): string => {
  switch (action) {
    case BoardActivityAction.post_create:
    case BoardActivityAction.comment_create:
    case BoardActivityAction.upvote:
      return "text-emerald-700 dark:text-emerald-400";
    case BoardActivityAction.post_delete:
    case BoardActivityAction.comment_delete:
    case BoardActivityAction.upvote_cancel:
    case BoardActivityAction.downvote_cancel:
      return "text-rose-700 dark:text-rose-400";
    case BoardActivityAction.downvote:
      return "text-amber-700 dark:text-amber-400";
    case BoardActivityAction.post_read:
      return "text-sky-700 dark:text-sky-400";
    default:
      return "text-foreground";
  }
};

export default function Page() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<BoardActivityReadProps["action"]>("all");

  const query: BoardActivityReadProps = {
    page,
    pageSize: PAGE_SIZE,
    action,
  };

  const { data } = useGetQuery<
    BoardActivityResponse | null,
    BoardActivityReadProps
  >(
    { queryKey: [{ [QueryKey.boardActivity]: query }] },
    boardActivityGet,
    query
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            내 게시판 활동
          </CardTitle>
          <CardDescription>
            작성, 조회, 댓글, 투표 등 게시판에서의 활동 내역을 확인할 수
            있습니다.
          </CardDescription>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                type="button"
                size="sm"
                variant={action === f.value ? "default" : "outline"}
                onClick={() => {
                  setAction(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              표시할 활동이 없습니다.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((row) => {
                const targetHref =
                  row.topic_url && row.thread_id
                    ? `/board/${row.topic_url}/${row.thread_id}`
                    : null;
                const target =
                  row.thread_title ??
                  row.comment_snippet ??
                  `#${row.thread_id ?? ""}`;
                return (
                  <li
                    key={row.id}
                    className="flex items-start gap-3 px-4 py-3 sm:px-6"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn("font-normal", actionTone(row.action))}
                        >
                          {boardActivityLabel(row.action)}
                        </Badge>
                        {row.topic_name && (
                          <span className="text-xs text-muted-foreground">
                            {row.topic_name}
                          </span>
                        )}
                        {row.note && (
                          <span className="text-xs text-muted-foreground">
                            ({row.note})
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm truncate">
                        {targetHref ? (
                          <Link href={targetHref} className="hover:underline">
                            {target}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">
                            {target}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                        {formatDate(row.created_at)}
                      </div>
                    </div>
                  </li>
                );
              })}
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
