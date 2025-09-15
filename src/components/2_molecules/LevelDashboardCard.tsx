"use client";

import type { level_setting } from "@prisma/client";
import type { LevelReadProps } from "@/app/api/admin_di2u3k2j/settings/level/read";
import clsx from "clsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminLevelGet } from "@/helpers/get";
import { QueryKey } from "@/helpers/types";

export const LevelDashboardCard = ({ className }: { className?: string }) => {
  const { data: levelData } = useGetQuery<level_setting, LevelReadProps>(
    {
      queryKey: [QueryKey.levelSettings],
    },
    adminLevelGet
  );

  return (
    <Card className={clsx(className)}>
      <CardHeader>
        <h4>레벨 설정</h4>
      </CardHeader>
      <CardContent className="[&>p]:leading-[140%]">
        <p>최대 레벨: {levelData?.max_system_level ?? 0}</p>
      </CardContent>
    </Card>
  );
};
