"use client";

import type { user_setting } from "@prisma/client";
import type { UserReadProps } from "@/app/api/admin_di2u3k2j/settings/user/read";
import clsx from "clsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminUserSettingGet } from "@/helpers/get";
import { QueryKey } from "@/helpers/types";

export const UserDashboardCard = ({ className }: { className?: string }) => {
  const { data: userData } = useGetQuery<user_setting, UserReadProps>(
    {
      queryKey: [QueryKey.userSettings],
    },
    adminUserSettingGet
  );

  return (
    <Card className={clsx(className)}>
      <CardHeader>
        <h4>사용자 설정</h4>
      </CardHeader>
      <CardContent className="[&>p]:leading-[140%]">
        <p>기본 사용자 레벨: {userData?.default_user_level ?? 0}</p>
        <p>
          탈퇴 유저 자동 삭제 기간:{" "}
          {(userData?.user_delete_days ?? 0) > 0
            ? `${userData!.user_delete_days}일 이후`
            : "-"}
        </p>
      </CardContent>
    </Card>
  );
};
