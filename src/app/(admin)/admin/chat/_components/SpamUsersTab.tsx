"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { RotateCw } from "lucide-react";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { adminChatSpamUsersGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

import dayjs from "dayjs";

import ResponsiveTable from "./ResponsiveTable";
import ModerationCard from "./ModerationCard";

interface SpamUser {
  uid: string;
  displayname: string | null;
  offences: number;
  penalty_until: string | null;
  memory_until: string | null;
}

interface SpamUsersData {
  available: boolean;
  users: SpamUser[];
}

// Offence count → the penalty tier it produced (mirrors the chat_server's
// SpamTracker ladder: 1st offence is a warning, 4th+ stays at tier 3).
const tierLabel = (offences: number) => {
  if (offences <= 1) return "경고";
  if (offences === 2) return "1단계";
  if (offences === 3) return "2단계";
  return "3단계";
};

export default function SpamUsersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useGetQuery<SpamUsersData | null, undefined>(
    { queryKey: [QueryKey.chatSpamUsers] },
    adminChatSpamUsersGet,
    undefined,
    { silent: true }
  );

  const available = data?.available ?? true;
  const users = useMemo(() => data?.users ?? [], [data]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [releasing, setReleasing] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.uid.toLowerCase().includes(q) ||
        (u.displayname ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const refresh = () => {
    setSelected(new Set());
    refreshCache(queryClient, QueryKey.chatSpamUsers);
  };

  const toggle = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((u) => selected.has(u.uid));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filtered.forEach((u) => next.delete(u.uid));
        return next;
      }
      return new Set([...prev, ...filtered.map((u) => u.uid)]);
    });
  };

  const forgive = async (uids: string[]) => {
    if (uids.length === 0 || releasing) return;
    setReleasing(true);
    const res = await postJson(ApiRoute.adminChatModerationForgiveSpam, {
      uids,
    });
    setReleasing(false);
    toast({
      id: res?.isSuccess
        ? ToastData.chatModerationForgiveSpam
        : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>스팸 (도배) 유저</CardTitle>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RotateCw className="w-3 h-3 mr-1" />
          새로고침
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          도배 감지로 제재 중이거나 경고가 누적된 유저 목록입니다. 해제하면 누적
          기록과 채팅 제한이 즉시 초기화됩니다. 제재는 서버 재시작 시 자동으로
          초기화됩니다.
        </p>

        {!available && (
          <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400">
            채팅 서버에 연결할 수 없어 도배 상태를 조회하지 못했습니다.
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="닉네임 또는 UID로 검색"
            className="sm:max-w-xs"
          />
          <div className="flex items-center gap-2 sm:ml-auto">
            {selected.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {selected.size}명 선택됨
              </span>
            )}
            <Button
              size="sm"
              disabled={selected.size === 0 || releasing}
              onClick={() => forgive([...selected])}
            >
              {releasing ? "해제 중…" : `선택 해제 (${selected.size})`}
            </Button>
          </div>
        </div>

        <ResponsiveTable
          columns={[
            {
              header: (
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleAll}
                  aria-label="전체 선택"
                />
              ),
              className: "w-10",
            },
            { header: "유저" },
            { header: "단계", className: "w-20" },
            { header: "상태", className: "w-44" },
            { header: "작업", className: "w-24", align: "right" },
          ]}
          rows={filtered.map((u) => {
            const displayName = u.displayname ?? u.uid;
            const locked = !!u.penalty_until;
            const status = locked ? (
              <Badge variant="destructive">
                제한 중 — {dayjs(u.penalty_until).format("MM-DD HH:mm")} 까지
              </Badge>
            ) : (
              <Badge variant="secondary">
                경고 누적
                {u.memory_until &&
                  ` — ${dayjs(u.memory_until).format("MM-DD HH:mm")} 초기화`}
              </Badge>
            );
            const tier = (
              <span className="text-muted-foreground">
                {tierLabel(u.offences)} ({u.offences}회)
              </span>
            );
            const check = (
              <Checkbox
                checked={selected.has(u.uid)}
                onCheckedChange={() => toggle(u.uid)}
                aria-label={`${displayName} 선택`}
              />
            );
            const action = (
              <Button
                variant="ghost"
                size="sm"
                disabled={releasing}
                onClick={() => forgive([u.uid])}
              >
                도배 해제
              </Button>
            );
            const userCell = (
              <>
                {displayName}
                <div className="text-[10px] text-muted-foreground">{u.uid}</div>
              </>
            );
            return {
              key: u.uid,
              cells: [check, userCell, tier, status, action],
              mobile: (
                <ModerationCard
                  title={
                    <div className="flex items-center gap-2">
                      {check}
                      <div>
                        {displayName}
                        <div className="text-[10px] text-muted-foreground font-normal break-all">
                          {u.uid}
                        </div>
                      </div>
                    </div>
                  }
                  meta={`${tierLabel(u.offences)} (${u.offences}회)`}
                  badges={status}
                  actions={action}
                />
              ),
            };
          })}
          emptyMessage={
            search ? "검색 결과가 없습니다." : "도배 제재 중인 유저가 없습니다."
          }
        />
      </CardContent>
    </Card>
  );
}
