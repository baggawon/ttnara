"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

import { useQueryClient } from "@tanstack/react-query";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminChatSettingsGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

interface ChatSetting {
  id: number;
  chat_server_url: string;
  level_moderator: number;
  level_chat: number;
  max_chat_length: number;
  max_display_items: number;
  spam_frequency_seconds: number;
  spam_penalty_second: number;
  spam_penalty_third: number;
  spam_penalty_last: number;
  chat_delete_hours: number;
  chat_rank_source: "trade" | "board" | "none";
}

const rankSourceOptions: Array<{
  value: ChatSetting["chat_rank_source"];
  label: string;
}> = [
  { value: "trade", label: "거래 등급" },
  { value: "board", label: "게시판 등급" },
  { value: "none", label: "표시 안 함" },
];

const numberFields: Array<{
  key: keyof ChatSetting;
  label: string;
  hint?: string;
}> = [
  { key: "level_chat", label: "채팅 권한 레벨" },
  { key: "level_moderator", label: "관리자 레벨" },
  { key: "max_chat_length", label: "최대 메시지 길이", hint: "글자 수" },
  { key: "max_display_items", label: "최대 표시 메시지", hint: "개수" },
  { key: "spam_frequency_seconds", label: "도배 방지 간격", hint: "초" },
  { key: "spam_penalty_second", label: "2회 위반 패널티", hint: "분" },
  { key: "spam_penalty_third", label: "3회 위반 패널티", hint: "분" },
  { key: "spam_penalty_last", label: "이후 위반 패널티", hint: "분" },
  { key: "chat_delete_hours", label: "메시지 보관 시간", hint: "시간" },
];

export default function SettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data } = useGetQuery<ChatSetting | null, undefined>(
    { queryKey: [QueryKey.chatSettings] },
    adminChatSettingsGet,
    undefined,
    { silent: true }
  );

  const [form, setForm] = useState<ChatSetting | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (!form)
    return <div className="text-sm text-muted-foreground">불러오는 중…</div>;

  const update = (patch: Partial<ChatSetting>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  const submit = async () => {
    setSaving(true);
    const payload: Partial<ChatSetting> = { ...form };
    delete (payload as any).id;
    const res = await postJson(ApiRoute.adminChatSettingsUpdate, payload);
    setSaving(false);
    toast({
      id: res?.isSuccess ? ToastData.chatSettingsUpdate : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    // Invalidate the cached chatSettings query so other consumers / a fresh
    // remount read the saved values instead of the pre-save cache. The current
    // form intentionally keeps the just-saved state (it's the source of truth
    // here), so we don't re-seed it from the refetch.
    if (res?.isSuccess) refreshCache(queryClient, QueryKey.chatSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>채팅 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">채팅 서버 URL</label>
          <Input
            value={form.chat_server_url}
            placeholder="wss://chat.example.com/ws"
            onChange={(e) => update({ chat_server_url: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            클라이언트가 WebSocket으로 접속할 주소. 비우면 채팅이
            비활성화됩니다.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">채팅 등급 아이콘</label>
          <Select
            value={form.chat_rank_source ?? "none"}
            onValueChange={(v) =>
              update({ chat_rank_source: v as ChatSetting["chat_rank_source"] })
            }
          >
            <SelectTrigger className="w-full sm:w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rankSourceOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            채팅 이름 옆에 표시할 등급 배지를 선택합니다. 변경 후 보내는
            메시지부터 적용됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {numberFields.map(({ key, label, hint }) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium">{label}</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={(form[key] as number) ?? 0}
                  onChange={(e) =>
                    update({ [key]: Number(e.target.value) || 0 } as any)
                  }
                />
                {hint && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {hint}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
