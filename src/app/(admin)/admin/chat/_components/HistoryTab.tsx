"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { RotateCw } from "lucide-react";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminChatHistoryGet, adminChatTopicsGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

import dayjs from "dayjs";

import ResponsiveTable from "./ResponsiveTable";
import ModerationCard from "./ModerationCard";

interface ModEvent {
  id: number;
  action: string;
  by_admin_id: string | null;
  reason: string | null;
  metadata: any;
  created_at: string;
}

interface HistoryRow {
  id: string;
  topic_id: number;
  uid: string;
  displayname: string;
  rank_level: number;
  content: string;
  is_hidden: boolean;
  hidden_by_id: string | null;
  hidden_at: string | null;
  created_at: string;
  mod_events: ModEvent[];
}

interface PaginatedHistory {
  messages: HistoryRow[];
  pagination: { page: number; pageSize: number; totalCount: number };
}

interface TopicOption {
  id: number;
  name: string;
}

const ACTION_LABEL: Record<string, { label: string; tone: "warn" | "danger" }> =
  {
    spam_warning: { label: "도배 경고", tone: "warn" },
    spam_penalty_1: { label: "도배 1단계", tone: "warn" },
    spam_penalty_2: { label: "도배 2단계", tone: "danger" },
    spam_penalty_3: { label: "도배 3단계", tone: "danger" },
    mute: { label: "뮤트", tone: "danger" },
    unmute: { label: "뮤트해제", tone: "warn" },
    ban: { label: "차단", tone: "danger" },
    unban: { label: "차단해제", tone: "warn" },
    hide: { label: "숨김", tone: "danger" },
    unhide: { label: "숨김해제", tone: "warn" },
  };

export default function HistoryTab() {
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();

  const { data: topics } = useGetQuery<TopicOption[] | null, undefined>(
    { queryKey: [QueryKey.adminChatTopics] },
    adminChatTopicsGet
  );

  const [topicId, setTopicId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const queryParams = {
    page,
    pageSize,
    ...(topicId !== "all" && { topic_id: Number(topicId) }),
    ...(search && { search }),
  };

  const { data } = useGetQuery<PaginatedHistory | null, typeof queryParams>(
    { queryKey: [{ [QueryKey.chatHistory]: queryParams }] },
    adminChatHistoryGet,
    queryParams
  );

  const rows = data?.messages ?? [];
  const total = data?.pagination?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const refresh = () => refreshCache(queryClient, QueryKey.chatHistory);

  const hide = async (id: string) => {
    const res = await postJson(ApiRoute.adminChatModerationHide, {
      message_id: id,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatModerationHide : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refresh();
  };

  const unhide = async (id: string) => {
    const res = await postJson(ApiRoute.adminChatModerationUnhide, {
      message_id: id,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatModerationUnhide : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refresh();
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>채팅 기록</CardTitle>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RotateCw className="w-3 h-3 mr-1" />
          새로고침
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={submitSearch}
          className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2"
        >
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">토픽</label>
            <Select
              value={topicId}
              onValueChange={(v) => {
                setTopicId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {(topics ?? []).map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 sm:min-w-[200px] space-y-1">
            <label className="text-xs text-muted-foreground">메시지 검색</label>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="내용으로 검색"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              검색
            </Button>
            {(search || topicId !== "all") && (
              <Button
                type="button"
                variant="ghost"
                className="flex-1 sm:flex-initial"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setTopicId("all");
                  setPage(1);
                }}
              >
                초기화
              </Button>
            )}
          </div>
        </form>

        <ResponsiveTable
          columns={[
            { header: "시각", className: "w-36" },
            { header: "토픽", className: "w-24" },
            { header: "작성자", className: "w-28" },
            { header: "내용 / 제재 기록" },
            { header: "작업", className: "w-24", align: "right" },
          ]}
          rows={rows.map((m) => {
            const topicName =
              (topics ?? []).find((t) => t.id === m.topic_id)?.name ??
              `#${m.topic_id}`;
            const when = dayjs(m.created_at).format("MM-DD HH:mm:ss");
            const author = (
              <>
                <div>{m.displayname}</div>
                <div className="text-[10px] text-muted-foreground">
                  Lv. {m.rank_level}
                </div>
              </>
            );
            const body = (
              <div className="space-y-1">
                <div
                  className={
                    m.is_hidden
                      ? "line-through text-muted-foreground break-words"
                      : "break-words"
                  }
                >
                  {m.content}
                </div>
                {m.is_hidden && (
                  <Badge variant="secondary" className="text-[10px]">
                    숨김 — {dayjs(m.hidden_at ?? "").format("MM-DD HH:mm")}
                  </Badge>
                )}
                {m.mod_events.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {m.mod_events.map((e) => {
                      const meta = ACTION_LABEL[e.action] ?? {
                        label: e.action,
                        tone: "warn" as const,
                      };
                      return (
                        <span
                          key={e.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            meta.tone === "danger"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                          title={[
                            dayjs(e.created_at).format("HH:mm:ss"),
                            e.reason,
                            e.by_admin_id ? `by ${e.by_admin_id}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        >
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
            const action = m.is_hidden ? (
              <Button variant="ghost" size="sm" onClick={() => unhide(m.id)}>
                숨김 해제
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => hide(m.id)}>
                숨김
              </Button>
            );
            const whenCell = (
              <span className="text-muted-foreground">{when}</span>
            );
            return {
              key: m.id,
              cells: [whenCell, topicName, author, body, action],
              mobile: (
                <ModerationCard
                  title={
                    <span>
                      {m.displayname}
                      <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                        Lv. {m.rank_level}
                      </span>
                    </span>
                  }
                  meta={
                    <span>
                      {topicName}
                      <span className="mx-1">·</span>
                      {when}
                    </span>
                  }
                  body={body}
                  actions={action}
                />
              ),
            };
          })}
          emptyMessage="메시지가 없습니다."
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">총 {total}건</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <span className="px-2 py-1">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
