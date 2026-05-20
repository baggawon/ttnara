"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminChatBannedWordsGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

interface BannedWord {
  id: number;
  word: string;
  created_at: string;
}

export default function BannedWordsTab() {
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();
  const { data } = useGetQuery<BannedWord[] | null, undefined>(
    { queryKey: [QueryKey.chatBannedWords] },
    adminChatBannedWordsGet
  );
  const words = data ?? [];

  const [bulk, setBulk] = useState("");

  const refresh = () => refreshCache(queryClient, QueryKey.chatBannedWords);

  const add = async () => {
    if (!bulk.trim()) return;
    const tokens = bulk
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await postJson(ApiRoute.adminChatBannedWordsUpdate, {
      words: bulk,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatBannedWordAdd : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
      value: String(tokens.length),
    });
    if (res?.isSuccess) {
      setBulk("");
      refresh();
    }
  };

  const remove = async (id: number) => {
    const res = await postJson(ApiRoute.adminChatBannedWordsDelete, {
      ids: [id],
    });
    toast({
      id: res?.isSuccess ? ToastData.chatBannedWordDelete : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>금지어 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="쉼표 또는 줄바꿈으로 구분하여 여러 단어를 한꺼번에 추가할 수 있습니다."
            rows={3}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={add}>추가</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {words.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => remove(w.id)}
              title="삭제"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-xs border border-red-200"
            >
              {w.word}
              <span className="text-[10px]">×</span>
            </button>
          ))}
          {words.length === 0 && (
            <span className="text-sm text-muted-foreground">
              등록된 금지어가 없습니다.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
