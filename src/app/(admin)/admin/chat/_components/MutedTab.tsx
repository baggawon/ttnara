"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { RotateCw } from "lucide-react";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminChatMutedUsersGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

import dayjs from "dayjs";

import ResponsiveTable from "./ResponsiveTable";
import ModerationCard from "./ModerationCard";

interface MutedUser {
  uid: string;
  until: string;
  by_admin_id: string | null;
  reason: string | null;
  created_at: string;
  displayname: string | null;
  is_active: boolean;
}

export default function MutedTab() {
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();
  const { data } = useGetQuery<MutedUser[] | null, undefined>(
    { queryKey: [QueryKey.chatMutedUsers] },
    adminChatMutedUsersGet
  );
  const rows = data ?? [];

  const refresh = () => refreshCache(queryClient, QueryKey.chatMutedUsers);

  const unmute = async (uid: string) => {
    const res = await postJson(ApiRoute.adminChatModerationUnmute, { uid });
    toast({
      id: res?.isSuccess ? ToastData.chatModerationUnmute : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>뮤트 유저 목록</CardTitle>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RotateCw className="w-3 h-3 mr-1" />
          새로고침
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveTable
          columns={[
            { header: "유저" },
            { header: "해제 시각" },
            { header: "사유" },
            { header: "상태", className: "w-20" },
            { header: "작업", className: "w-24", align: "right" },
          ]}
          rows={rows.map((r) => {
            const displayName = r.displayname ?? r.uid;
            const until = dayjs(r.until).format("YYYY-MM-DD HH:mm");
            const status = r.is_active ? (
              <Badge variant="destructive">뮤트 중</Badge>
            ) : (
              <Badge variant="secondary">만료</Badge>
            );
            const action = (
              <Button variant="ghost" size="sm" onClick={() => unmute(r.uid)}>
                해제
              </Button>
            );
            const userCell = (
              <>
                {displayName}
                <div className="text-[10px] text-muted-foreground">{r.uid}</div>
              </>
            );
            const reasonCell = (
              <span className="text-muted-foreground">{r.reason ?? "-"}</span>
            );
            return {
              key: r.uid,
              cells: [userCell, until, reasonCell, status, action],
              mobile: (
                <ModerationCard
                  title={
                    <>
                      {displayName}
                      <div className="text-[10px] text-muted-foreground font-normal break-all">
                        {r.uid}
                      </div>
                    </>
                  }
                  meta={`해제 ${until}`}
                  badges={status}
                  body={
                    r.reason ? (
                      <span className="text-muted-foreground">
                        사유: {r.reason}
                      </span>
                    ) : null
                  }
                  actions={action}
                />
              ),
            };
          })}
          emptyMessage="뮤트된 사용자가 없습니다."
        />
      </CardContent>
    </Card>
  );
}
