"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminChatNoticesGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

import ResponsiveTable from "./ResponsiveTable";
import ModerationCard from "./ModerationCard";

interface ChatNotice {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  display_order: number;
}

export default function NoticesTab() {
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();
  const { data } = useGetQuery<ChatNotice[] | null, undefined>(
    { queryKey: [QueryKey.chatNotices] },
    adminChatNoticesGet
  );
  const notices = data ?? [];

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [order, setOrder] = useState(1);

  const refresh = () => refreshCache(queryClient, QueryKey.chatNotices);

  const create = async () => {
    if (!title.trim() || !content.trim()) return;
    const res = await postJson(ApiRoute.adminChatNoticesUpdate, {
      title,
      content,
      display_order: order,
      is_active: true,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatNoticeSave : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) {
      setTitle("");
      setContent("");
      setOrder(1);
      refresh();
    }
  };

  const toggleActive = async (n: ChatNotice) => {
    const res = await postJson(ApiRoute.adminChatNoticesUpdate, {
      id: n.id,
      title: n.title,
      content: n.content,
      display_order: n.display_order,
      is_active: !n.is_active,
    });
    if (res?.isSuccess) refresh();
  };

  const remove = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await postJson(ApiRoute.adminChatNoticesDelete, { ids: [id] });
    toast({
      id: res?.isSuccess ? ToastData.chatNoticeDelete : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>채팅 공지 (캐러셀)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 border rounded-md p-3">
          <Input
            placeholder="제목 (최대 100자)"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="내용 (최대 200자)"
            maxLength={200}
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex items-end gap-2">
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
        </div>

        <ResponsiveTable
          columns={[
            { header: "제목" },
            { header: "내용" },
            { header: "순서", className: "w-20" },
            { header: "상태", className: "w-24" },
            { header: "작업", align: "right" },
          ]}
          rows={notices.map((n) => {
            const status = (
              <button type="button" onClick={() => toggleActive(n)}>
                {n.is_active ? (
                  <Badge variant="default">활성</Badge>
                ) : (
                  <Badge variant="secondary">비활성</Badge>
                )}
              </button>
            );
            const action = (
              <Button variant="ghost" size="sm" onClick={() => remove(n.id)}>
                삭제
              </Button>
            );
            const titleCell = <span className="break-words">{n.title}</span>;
            const contentCell = (
              <span className="text-muted-foreground break-words">
                {n.content}
              </span>
            );
            return {
              key: n.id,
              cells: [titleCell, contentCell, n.display_order, status, action],
              mobile: (
                <ModerationCard
                  title={n.title}
                  meta={`순서 ${n.display_order}`}
                  badges={status}
                  body={
                    <span className="text-muted-foreground">{n.content}</span>
                  }
                  actions={action}
                />
              ),
            };
          })}
          emptyMessage="공지가 없습니다."
        />
      </CardContent>
    </Card>
  );
}
