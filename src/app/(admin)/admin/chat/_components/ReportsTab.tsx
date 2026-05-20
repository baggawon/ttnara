"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { RotateCw } from "lucide-react";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminChatReportsGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

import dayjs from "dayjs";

import ResponsiveTable from "./ResponsiveTable";
import ModerationCard from "./ModerationCard";

interface Report {
  id: number;
  reporter_id: string;
  message_id: string;
  reason: string | null;
  created_at: string;
  reporter_displayname: string | null;
  message: {
    id: string;
    content: string;
    uid: string;
    displayname: string;
    topic_id: number;
    is_hidden: boolean;
  } | null;
}

interface PaginatedReports {
  reports: Report[];
  pagination: { page: number; pageSize: number; totalCount: number };
}

export default function ReportsTab() {
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data } = useGetQuery<
    PaginatedReports | null,
    { page: number; pageSize: number }
  >(
    { queryKey: [{ [QueryKey.chatReports]: { page, pageSize } }] },
    adminChatReportsGet,
    { page, pageSize }
  );

  const rows = data?.reports ?? [];
  const total = data?.pagination?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const refreshReports = () => refreshCache(queryClient, QueryKey.chatReports);
  const refreshHidden = () =>
    refreshCache(queryClient, QueryKey.chatHiddenMessages);

  const hide = async (messageId: string) => {
    const res = await postJson(ApiRoute.adminChatModerationHide, {
      message_id: messageId,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatModerationHide : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) {
      refreshReports();
      refreshHidden();
    }
  };

  const ban = async (uid: string) => {
    if (!confirm("작성자를 차단하시겠습니까?")) return;
    const res = await postJson(ApiRoute.adminChatModerationBan, { uid });
    toast({
      id: res?.isSuccess ? ToastData.chatModerationBan : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refreshReports();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>신고 내역</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            refreshReports();
            refreshHidden();
          }}
        >
          <RotateCw className="w-3 h-3 mr-1" />
          새로고침
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveTable
          columns={[
            { header: "시각", className: "w-36" },
            { header: "신고자", className: "w-24" },
            { header: "작성자", className: "w-24" },
            { header: "메시지 / 사유" },
            { header: "작업", className: "w-32", align: "right" },
          ]}
          rows={rows.map((r) => {
            const when = dayjs(r.created_at).format("MM-DD HH:mm");
            const reporter = r.reporter_displayname ?? r.reporter_id;
            const author = r.message?.displayname ?? "-";
            const body = (
              <div className="space-y-1">
                <div
                  className={
                    r.message?.is_hidden
                      ? "line-through text-muted-foreground break-words"
                      : "break-words"
                  }
                >
                  {r.message?.content ?? (
                    <span className="text-muted-foreground">[삭제됨]</span>
                  )}
                </div>
                {r.reason && (
                  <div className="text-xs text-muted-foreground">
                    사유: {r.reason}
                  </div>
                )}
                {r.message?.is_hidden && (
                  <Badge variant="secondary">숨김</Badge>
                )}
              </div>
            );
            const actions = (
              <>
                {r.message && !r.message.is_hidden && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => hide(r.message!.id)}
                  >
                    숨김
                  </Button>
                )}
                {r.message && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => ban(r.message!.uid)}
                  >
                    차단
                  </Button>
                )}
              </>
            );
            const whenCell = (
              <span className="text-muted-foreground">{when}</span>
            );
            const actionsCell = <span className="space-x-1">{actions}</span>;
            return {
              key: r.id,
              cells: [whenCell, reporter, author, body, actionsCell],
              mobile: (
                <ModerationCard
                  title={
                    <span>
                      {reporter}
                      <span className="mx-1 text-muted-foreground">→</span>
                      {author}
                    </span>
                  }
                  meta={when}
                  body={body}
                  actions={actions}
                />
              ),
            };
          })}
          emptyMessage="신고 내역이 없습니다."
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs">
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
