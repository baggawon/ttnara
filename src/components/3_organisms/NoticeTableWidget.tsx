"use client";

import type { SummaryThreadsListResponse } from "@/app/api/summary_threads/read";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { sessionGet, summaryThreadsGet } from "@/helpers/get";
import { AppRoute, QueryKey } from "@/helpers/types";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { isCuid } from "@paralleldrive/cuid2";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { Card, CardContent } from "@/components/ui/card";
import { TetherRecentList } from "./TetherRecentList";
import { FormProvider, useForm } from "react-hook-form";

const NoticeTableWidget = () => {
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    {
      queryKey: [QueryKey.session],
    },
    sessionGet
  );

  const { data: summariesData } = useGetQuery<
    SummaryThreadsListResponse,
    undefined
  >(
    {
      queryKey: [QueryKey.summaryThreads],
    },
    summaryThreadsGet
  );

  const methods = useForm({ reValidateMode: "onSubmit" });

  const router = useRouter();

  useEffectFunctionHook({
    Function: () => {
      if (
        session?.user?.displayname &&
        isCuid(session.user.displayname) &&
        session.user.displayname.length === 24
      ) {
        router.push(AppRoute.AccountSetting);
      }
    },
    dependency: [session],
  });

  return (
    <FormProvider {...methods}>
      <>
        <Card className="h-full">
          <CardContent className="pt-4 h-full">
            <TetherRecentList
              session={session}
              tethers={summariesData?.summaries}
            />
          </CardContent>
        </Card>
      </>
    </FormProvider>
  );
};

export default NoticeTableWidget;
