"use client";

import type { SummaryThreadsListResponse } from "@/app/api/summary_threads/read";
import { now } from "@/helpers/basic";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { sessionGet, summaryThreadsGet } from "@/helpers/get";
import { AppRoute, QueryKey } from "@/helpers/types";
import type { Session } from "next-auth";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { isCuid } from "@paralleldrive/cuid2";
import { useRouter } from "next/navigation";
import { TetherTable } from "./TetherTable";
import MobilePriceWidget from "@/components/1_atoms/MobilePriceWidget";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export interface NoticeTableData {
  id: string;
  title: string;
  contents: string;
  timestamp: number;
}

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

  const methods = useForm({
    defaultValues: {},
    reValidateMode: "onSubmit",
  });
  return (
    <FormProvider {...methods}>
      <>
        <MobilePriceWidget />
        <Card>
          <CardHeader>
            <h1>{`${now().format("YYYY-MM-DD")} P2P 거래 현황`}</h1>
          </CardHeader>
          <CardContent>
            <section className="w-full grid grid-cols-1 gap-4">
              <TetherTable
                session={session}
                tethers={summariesData?.summaries}
                setPageIndexAction={(_index: number) => {}}
              />
            </section>
          </CardContent>
        </Card>
        <Link
          href={`${AppRoute.Threads}/tether`}
          className="w-full text-center"
        >
          <Button type="button">더보기</Button>
        </Link>
      </>
    </FormProvider>
  );
};

export default NoticeTableWidget;
