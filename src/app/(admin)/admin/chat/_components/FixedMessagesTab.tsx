"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { adminChatFixedMessagesGet, adminChatTopicsGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

import ResponsiveTable from "./ResponsiveTable";
import ModerationCard from "./ModerationCard";

interface FixedMessage {
  id: number;
  topic_id: number;
  content: string;
  is_active: boolean;
}

interface TopicOption {
  id: number;
  name: string;
}

export default function FixedMessagesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: msgs } = useGetQuery<FixedMessage[] | null, undefined>(
    { queryKey: [QueryKey.chatFixedMessages] },
    adminChatFixedMessagesGet,
    undefined,
    { silent: true }
  );
  const { data: topics } = useGetQuery<TopicOption[] | null, undefined>(
    { queryKey: [QueryKey.adminChatTopics] },
    adminChatTopicsGet,
    undefined,
    { silent: true }
  );

  const [topicId, setTopicId] = useState<string>("");
  const [content, setContent] = useState("");

  const topicNameById = new Map((topics ?? []).map((t) => [t.id, t.name]));

  const refresh = () => refreshCache(queryClient, QueryKey.chatFixedMessages);

  const save = async () => {
    if (!topicId || !content.trim()) return;
    const res = await postJson(ApiRoute.adminChatFixedMessagesUpdate, {
      topic_id: Number(topicId),
      content,
      is_active: true,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatFixedMessageSave : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) {
      setContent("");
      setTopicId("");
      refresh();
    }
  };

  const remove = async (topic: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await postJson(ApiRoute.adminChatFixedMessagesDelete, {
      topic_id: topic,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatFixedMessageDelete : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refresh();
  };

  const messages = msgs ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>고정 메시지 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          토픽당 한 개의 고정 메시지만 설정할 수 있습니다. 같은 토픽에 새로
          저장하면 기존 메시지를 덮어씁니다.
        </p>

        <div className="space-y-2 border rounded-md p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="토픽 선택" />
              </SelectTrigger>
              <SelectContent>
                {(topics ?? []).map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={save} className="sm:w-auto">
              저장
            </Button>
          </div>
          <Textarea
            placeholder="내용 (최대 500자)"
            maxLength={500}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <ResponsiveTable
          columns={[
            { header: "토픽", className: "w-32" },
            { header: "내용" },
            { header: "상태", className: "w-20" },
            { header: "작업", className: "w-20", align: "right" },
          ]}
          rows={messages.map((m) => {
            const topicName = topicNameById.get(m.topic_id) ?? `#${m.topic_id}`;
            const status = m.is_active ? (
              <Badge variant="default">활성</Badge>
            ) : (
              <Badge variant="secondary">비활성</Badge>
            );
            const action = (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(m.topic_id)}
              >
                삭제
              </Button>
            );
            const contentCell = (
              <span className="break-words">{m.content}</span>
            );
            return {
              key: m.id,
              cells: [topicName, contentCell, status, action],
              mobile: (
                <ModerationCard
                  title={topicName}
                  badges={status}
                  body={m.content}
                  actions={action}
                />
              ),
            };
          })}
          emptyMessage="고정 메시지가 없습니다."
        />
      </CardContent>
    </Card>
  );
}
