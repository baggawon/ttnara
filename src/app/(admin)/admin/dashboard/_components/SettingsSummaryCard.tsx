"use client";

import type {
  general_setting,
  level_setting,
  user_setting,
} from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import {
  adminGeneralGet,
  adminLevelGet,
  adminUserSettingGet,
} from "@/helpers/get";
import { QueryKey } from "@/helpers/types";
import type { GeneralReadProps } from "@/app/api/admin_di2u3k2j/settings/general/read";
import type { LevelReadProps } from "@/app/api/admin_di2u3k2j/settings/level/read";
import type { UserReadProps } from "@/app/api/admin_di2u3k2j/settings/user/read";

export const SettingsSummaryCard = () => {
  const { data: generalData } = useGetQuery<general_setting, GeneralReadProps>(
    { queryKey: [QueryKey.generalSettings] },
    adminGeneralGet,
    undefined,
    { silent: true }
  );
  const { data: levelData } = useGetQuery<level_setting, LevelReadProps>(
    { queryKey: [QueryKey.levelSettings] },
    adminLevelGet,
    undefined,
    { silent: true }
  );
  const { data: userData } = useGetQuery<user_setting, UserReadProps>(
    { queryKey: [QueryKey.userSettings] },
    adminUserSettingGet,
    undefined,
    { silent: true }
  );

  const deleteDays = userData?.user_delete_days ?? 0;

  const rows: Array<{ label: string; value: string }> = [
    {
      label: "회원가입",
      value: generalData?.allow_user_registration ? "가능" : "불가능",
    },
    {
      label: "시스템 허용 최대 권한 레벨",
      value: `${levelData?.max_system_level ?? 0}`,
    },
    {
      label: "기본 사용자 권한 레벨",
      value: `${userData?.default_user_level ?? 0}`,
    },
    {
      label: "탈퇴 유저 자동 삭제",
      value: deleteDays > 0 ? `${deleteDays}일 이후` : "-",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">주요 설정</CardTitle>
        <p className="text-xs text-muted-foreground">현재 운영 설정 요약</p>
      </CardHeader>
      <CardContent>
        <dl className="text-sm divide-y">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
            >
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};
