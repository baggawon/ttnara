"use client";

import type { general_setting } from "@prisma/client";
import type { GeneralReadProps } from "@/app/api/admin_di2u3k2j/settings/general/read";
import clsx from "clsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminGeneralGet } from "@/helpers/get";
import { QueryKey } from "@/helpers/types";

export const SystemDashboardCard = ({ className }: { className?: string }) => {
  const { data: generalData } = useGetQuery<general_setting, GeneralReadProps>(
    {
      queryKey: [QueryKey.generalSettings],
    },
    adminGeneralGet
  );

  return (
    <Card className={clsx(className)}>
      <CardHeader>
        <h4>일반 설정</h4>
      </CardHeader>
      <CardContent className="[&>p]:leading-[140%]">
        <p>
          유지보수 모드: {generalData?.maintenance_mode ? "활성화" : "비활성화"}
        </p>
        <p>
          회원가입: {generalData?.allow_user_registration ? "가능" : "불가능"}
        </p>
      </CardContent>
    </Card>
  );
};
