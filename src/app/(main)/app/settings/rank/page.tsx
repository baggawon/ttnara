"use client";

import { useState } from "react";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { rankSummaryGet } from "@/helpers/get";
import { QueryKey } from "@/helpers/types";
import type { RankSummaryResponse } from "@/app/api/rank/summary";
import { RankProgression } from "@/components/3_organisms/rank/RankProgression";
import { useTetherEnabled } from "@/helpers/customHook/useTetherEnabled";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RankTab = "board" | "trade";

export default function Page() {
  const tetherEnabled = useTetherEnabled();
  const { data } = useGetQuery<RankSummaryResponse | null, undefined>(
    { queryKey: [QueryKey.rankSummary] },
    rankSummaryGet,
    undefined,
    { silent: true }
  );

  // When P2P trade is on, default to the trade view (the more relevant
  // ladder on a trading site); board sits to its left.
  const [tab, setTab] = useState<RankTab>("trade");

  if (!data) return null;

  const showTrade = tetherEnabled && !!data.trade;

  if (!showTrade) {
    return <RankProgression view={data.board} displayname={data.displayname} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as RankTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trade">거래 등급</TabsTrigger>
          <TabsTrigger value="board">게시판 등급</TabsTrigger>
        </TabsList>
      </Tabs>
      <RankProgression
        view={tab === "trade" ? data.trade! : data.board}
        displayname={data.displayname}
      />
    </div>
  );
}
