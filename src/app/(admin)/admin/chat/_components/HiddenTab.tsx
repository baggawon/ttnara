"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RotateCw } from "lucide-react";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminChatHiddenMessagesGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

import dayjs from "dayjs";

import ResponsiveTable from "./ResponsiveTable";
import ModerationCard from "./ModerationCard";

interface HiddenMessage {
  id: string;
  topic_id: number;
  uid: string;
  displayname: string;
  content: string;
  hidden_by_id: string | null;
  hidden_at: string | null;
  created_at: string;
}

interface PaginatedHidden {
  messages: HiddenMessage[];
  pagination: { page: number; pageSize: number; totalCount: number };
}

export default function HiddenTab() {
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data } = useGetQuery<
    PaginatedHidden | null,
    { page: number; pageSize: number }
  >(
    {
      queryKey: [{ [QueryKey.chatHiddenMessages]: { page, pageSize } }],
    },
    adminChatHiddenMessagesGet,
    { page, pageSize }
  );

  const rows = data?.messages ?? [];
  const total = data?.pagination?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const refresh = () => refreshCache(queryClient, QueryKey.chatHiddenMessages);

  const restore = async (id: string) => {
    if (!confirm("숨김을 해제하시겠습니까?")) return;
    const res = await postJson(ApiRoute.adminChatModerationUnhide, {
      message_id: id,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatModerationUnhide : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>숨김 메시지 목록</CardTitle>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RotateCw className="w-3 h-3 mr-1" />
          새로고침
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveTable
          columns={[
            { header: "시각", className: "w-40" },
            { header: "작성자", className: "w-28" },
            { header: "내용" },
            { header: "작업", className: "w-24", align: "right" },
          ]}
          rows={rows.map((m) => {
            const when = dayjs(m.hidden_at ?? m.created_at).format(
              "YYYY-MM-DD HH:mm"
            );
            const action = (
              <Button variant="ghost" size="sm" onClick={() => restore(m.id)}>
                숨김 해제
              </Button>
            );
            const whenCell = (
              <span className="text-muted-foreground">{when}</span>
            );
            const contentCell = (
              <span className="line-through text-muted-foreground break-words">
                {m.content}
              </span>
            );
            return {
              key: m.id,
              cells: [whenCell, m.displayname, contentCell, action],
              mobile: (
                <ModerationCard
                  title={m.displayname}
                  meta={when}
                  body={
                    <span className="line-through text-muted-foreground">
                      {m.content}
                    </span>
                  }
                  actions={action}
                />
              ),
            };
          })}
          emptyMessage="숨김 처리된 메시지가 없습니다."
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
