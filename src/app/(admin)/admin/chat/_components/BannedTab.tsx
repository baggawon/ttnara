"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RotateCw } from "lucide-react";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminChatBannedUsersGet } from "@/helpers/get";
import { postJson, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

import ResponsiveTable from "./ResponsiveTable";
import ModerationCard from "./ModerationCard";

interface BannedUser {
  id: string;
  username: string;
  profile: { displayname: string } | null;
}

export default function BannedTab() {
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();
  const { data } = useGetQuery<BannedUser[] | null, undefined>(
    { queryKey: [QueryKey.chatBannedUsers] },
    adminChatBannedUsersGet
  );
  const rows = data ?? [];

  const refresh = () => refreshCache(queryClient, QueryKey.chatBannedUsers);

  const unban = async (uid: string) => {
    const res = await postJson(ApiRoute.adminChatModerationUnban, { uid });
    toast({
      id: res?.isSuccess ? ToastData.chatModerationUnban : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    if (res?.isSuccess) refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>차단 유저 목록</CardTitle>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RotateCw className="w-3 h-3 mr-1" />
          새로고침
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveTable
          columns={[
            { header: "유저" },
            { header: "아이디" },
            { header: "작업", className: "w-24", align: "right" },
          ]}
          rows={rows.map((u) => {
            const displayName = u.profile?.displayname ?? u.username;
            const usernameCell = (
              <span className="text-muted-foreground">{u.username}</span>
            );
            const action = (
              <Button variant="ghost" size="sm" onClick={() => unban(u.id)}>
                차단 해제
              </Button>
            );
            return {
              key: u.id,
              cells: [displayName, usernameCell, action],
              mobile: (
                <ModerationCard
                  title={displayName}
                  body={
                    <span className="text-xs text-muted-foreground break-all">
                      {u.username}
                    </span>
                  }
                  actions={action}
                />
              ),
            };
          })}
          emptyMessage="차단된 사용자가 없습니다."
        />
      </CardContent>
    </Card>
  );
}
