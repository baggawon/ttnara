"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminChatTopicsGet, adminChatTopicStatsGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

import dayjs from "dayjs";

import ResponsiveTable from "./ResponsiveTable";
import ModerationCard from "./ModerationCard";

interface ChatTopic {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface TopicStat {
  topic_id: number;
  message_count: number;
  hidden_count: number;
  last_message_at: string | null;
  unique_authors: number;
}

interface RowDraft {
  name: string;
  display_order: number;
}

export default function TopicsTab() {
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();
  const { data } = useGetQuery<ChatTopic[] | null, undefined>(
    { queryKey: [QueryKey.adminChatTopics] },
    adminChatTopicsGet
  );
  const { data: statsData } = useGetQuery<TopicStat[] | null, undefined>(
    { queryKey: [QueryKey.chatTopicStats] },
    adminChatTopicStatsGet
  );
  const topics = data ?? [];
  const statsByTopic = new Map((statsData ?? []).map((s) => [s.topic_id, s]));

  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});

  useEffect(() => {
    setDrafts((prev) => {
      const list = data ?? [];
      const next: Record<number, RowDraft> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (list.some((t) => t.id === Number(k))) next[Number(k)] = v;
      }
      return next;
    });
  }, [data]);

  const [name, setName] = useState("");
  const [order, setOrder] = useState(1);

  // Type-to-confirm delete modal state.
  const [deleteTarget, setDeleteTarget] = useState<ChatTopic | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const refresh = () => {
    refreshCache(queryClient, QueryKey.adminChatTopics);
    refreshCache(queryClient, QueryKey.chatTopicStats);
  };

  const create = async () => {
    if (!name.trim()) return;
    const res = await postJson(ApiRoute.adminChatTopicsUpdate, {
      name,
      display_order: order,
      is_active: true,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatTopicSave : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) {
      setName("");
      setOrder(1);
      refresh();
    }
  };

  const startEdit = (t: ChatTopic) =>
    setDrafts((d) => ({
      ...d,
      [t.id]: { name: t.name, display_order: t.display_order },
    }));

  const cancelEdit = (id: number) =>
    setDrafts((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });

  const saveEdit = async (t: ChatTopic) => {
    const draft = drafts[t.id];
    if (!draft) return;
    if (!draft.name.trim()) return;
    const res = await postJson(ApiRoute.adminChatTopicsUpdate, {
      id: t.id,
      name: draft.name.trim(),
      display_order: draft.display_order,
      is_active: t.is_active,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatTopicSave : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) {
      cancelEdit(t.id);
      refresh();
    }
  };

  const move = async (t: ChatTopic, direction: -1 | 1) => {
    const sorted = [...topics].sort(
      (a, b) => a.display_order - b.display_order || a.id - b.id
    );
    const idx = sorted.findIndex((x) => x.id === t.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      postJson(ApiRoute.adminChatTopicsUpdate, {
        id: t.id,
        name: t.name,
        display_order: swapWith.display_order,
        is_active: t.is_active,
      }),
      postJson(ApiRoute.adminChatTopicsUpdate, {
        id: swapWith.id,
        name: swapWith.name,
        display_order: t.display_order,
        is_active: swapWith.is_active,
      }),
    ]);
    refresh();
  };

  const toggleActive = async (t: ChatTopic) => {
    const res = await postJson(ApiRoute.adminChatTopicsUpdate, {
      id: t.id,
      name: t.name,
      display_order: t.display_order,
      is_active: !t.is_active,
    });
    if (res?.isSuccess) refresh();
  };

  const openDelete = (t: ChatTopic) => {
    setDeleteTarget(t);
    setConfirmText("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (confirmText !== deleteTarget.name) return;
    setDeleting(true);
    const res = await postJson(ApiRoute.adminChatTopicsDelete, {
      ids: [deleteTarget.id],
      cascade: true,
    });
    setDeleting(false);
    toast({
      id: res?.isSuccess ? ToastData.chatTopicDelete : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) {
      setDeleteTarget(null);
      refresh();
    }
  };

  const sortedTopics = [...topics].sort(
    (a, b) => a.display_order - b.display_order || a.id - b.id
  );

  const targetStats = deleteTarget ? statsByTopic.get(deleteTarget.id) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>채팅 토픽 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-xs text-muted-foreground">이름</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs text-muted-foreground">순서</label>
              <Input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 1)}
              />
            </div>
            <Button onClick={create}>추가</Button>
          </div>

          <ResponsiveTable
            columns={[
              { header: "이름" },
              { header: "순서", className: "w-28" },
              { header: "상태", className: "w-20" },
              { header: "통계", className: "w-44" },
              { header: "작업", className: "w-40", align: "right" },
            ]}
            rows={sortedTopics.map((t, idx) => {
              const draft = drafts[t.id];
              const editing = !!draft;
              const stats = statsByTopic.get(t.id);

              const nameCell = editing ? (
                <Input
                  value={draft.name}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [t.id]: { ...d[t.id], name: e.target.value },
                    }))
                  }
                />
              ) : (
                t.name
              );

              const orderCell = editing ? (
                <Input
                  type="number"
                  value={draft.display_order}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [t.id]: {
                        ...d[t.id],
                        display_order: Number(e.target.value) || 1,
                      },
                    }))
                  }
                />
              ) : (
                <div className="flex items-center gap-1">
                  <span>{t.display_order}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-xs"
                    disabled={idx === 0}
                    onClick={() => move(t, -1)}
                    title="위로"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-xs"
                    disabled={idx === sortedTopics.length - 1}
                    onClick={() => move(t, 1)}
                    title="아래로"
                  >
                    ↓
                  </Button>
                </div>
              );

              const statusCell = (
                <button type="button" onClick={() => toggleActive(t)}>
                  {t.is_active ? (
                    <Badge variant="default">활성</Badge>
                  ) : (
                    <Badge variant="secondary">비활성</Badge>
                  )}
                </button>
              );

              const statsCell = (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>
                    메시지{" "}
                    <span className="font-medium text-foreground">
                      {stats?.message_count ?? 0}
                    </span>
                    {stats?.hidden_count ? (
                      <span className="ml-1 text-amber-600">
                        (숨김 {stats.hidden_count})
                      </span>
                    ) : null}
                  </div>
                  <div>
                    참여자{" "}
                    <span className="font-medium text-foreground">
                      {stats?.unique_authors ?? 0}
                    </span>
                  </div>
                  <div>
                    최근{" "}
                    {stats?.last_message_at
                      ? dayjs(stats.last_message_at).format("MM-DD HH:mm")
                      : "-"}
                  </div>
                </div>
              );

              const actionsCell = editing ? (
                <span className="space-x-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => saveEdit(t)}
                  >
                    저장
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelEdit(t.id)}
                  >
                    취소
                  </Button>
                </span>
              ) : (
                <span className="space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(t)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => openDelete(t)}
                  >
                    삭제
                  </Button>
                </span>
              );

              const mobile = editing ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      이름
                    </label>
                    {nameCell}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-24 space-y-1">
                      <label className="text-xs text-muted-foreground">
                        순서
                      </label>
                      {orderCell}
                    </div>
                    <div className="flex-1 flex justify-end gap-1">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => saveEdit(t)}
                      >
                        저장
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelEdit(t.id)}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <ModerationCard
                  title={t.name}
                  meta={
                    <div className="flex items-center gap-1">
                      <span>순서 {t.display_order}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-xs"
                        disabled={idx === 0}
                        onClick={() => move(t, -1)}
                        title="위로"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-xs"
                        disabled={idx === sortedTopics.length - 1}
                        onClick={() => move(t, 1)}
                        title="아래로"
                      >
                        ↓
                      </Button>
                    </div>
                  }
                  badges={statusCell}
                  body={statsCell}
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(t)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => openDelete(t)}
                      >
                        삭제
                      </Button>
                    </>
                  }
                />
              );

              return {
                key: t.id,
                cells: [
                  nameCell,
                  orderCell,
                  statusCell,
                  statsCell,
                  actionsCell,
                ],
                mobile,
              };
            })}
            emptyMessage="토픽이 없습니다."
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">토픽 영구 삭제</DialogTitle>
            <DialogDescription>
              이 작업은 되돌릴 수 없습니다. 토픽과 함께 모든 채팅 기록이 함께
              삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md border p-3 space-y-1">
                <div className="font-semibold">{deleteTarget.name}</div>
                <div className="text-xs text-muted-foreground">
                  메시지 {targetStats?.message_count ?? 0}개 (숨김{" "}
                  {targetStats?.hidden_count ?? 0}) · 참여자{" "}
                  {targetStats?.unique_authors ?? 0}명
                </div>
                <div className="text-xs text-muted-foreground">
                  최근 활동{" "}
                  {targetStats?.last_message_at
                    ? dayjs(targetStats.last_message_at).format(
                        "YYYY-MM-DD HH:mm"
                      )
                    : "-"}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                이 토픽을 영구 삭제하려면 아래에 토픽 이름을 정확히 입력하세요.
                일시적으로 숨기고 싶다면 대신{" "}
                <span className="font-medium">활성/비활성</span>을 사용하세요.
              </p>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  토픽 이름:{" "}
                  <span className="font-mono text-foreground">
                    {deleteTarget.name}
                  </span>
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={deleteTarget.name}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  disabled={confirmText !== deleteTarget.name || deleting}
                  onClick={confirmDelete}
                >
                  {deleting ? "삭제 중…" : "영구 삭제"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
