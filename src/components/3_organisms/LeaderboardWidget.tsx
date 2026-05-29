"use client";

import { useState } from "react";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { QueryKey } from "@/helpers/types";
import { leaderboardGet } from "@/helpers/get";
import { DisplayRank } from "@/components/1_atoms/DisplayRank";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { LeaderboardEntry } from "@/helpers/server/leaderboardService";

const periods = [
  { value: "total", label: "전체" },
  { value: "weekly", label: "주간" },
  { value: "daily", label: "일간" },
] as const;

const PositionBadge = ({ position }: { position: number }) => {
  if (position === 1)
    return <span className="text-lg font-bold text-yellow-500">1</span>;
  if (position === 2)
    return <span className="text-lg font-bold text-gray-400">2</span>;
  if (position === 3)
    return <span className="text-lg font-bold text-amber-600">3</span>;
  return <span className="text-sm text-muted-foreground">{position}</span>;
};

const PositionChange = ({
  position,
  prev_position,
}: {
  position: number;
  prev_position: number | null;
}) => {
  if (prev_position === null) {
    return <span className="text-xs font-medium text-success">New</span>;
  }
  const diff = prev_position - position;
  if (diff === 0)
    return <span className="text-xs text-muted-foreground">-</span>;
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-fail">
        <ArrowUp className="w-3 h-3" />
        {diff}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-blue-500">
      <ArrowDown className="w-3 h-3" />
      {Math.abs(diff)}
    </span>
  );
};

const LeaderboardTable = ({ period }: { period: string }) => {
  const { data } = useGetQuery<any, { period: string }>(
    {
      queryKey: [{ [QueryKey.leaderboard]: { period } }],
    },
    leaderboardGet,
    { period },
    { silent: true }
  );

  const entries: LeaderboardEntry[] = data?.entries ?? [];

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        랭킹 데이터가 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16 text-center">순위</TableHead>
          <TableHead className="w-16 text-center">변동</TableHead>
          <TableHead>닉네임</TableHead>
          <TableHead className="w-16 text-center">등급</TableHead>
          <TableHead className="w-24 text-right">포인트</TableHead>
          <TableHead className="w-20 text-right">거래수</TableHead>
          <TableHead className="w-20 text-right">평점</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.uid}>
            <TableCell className="text-center">
              <PositionBadge position={entry.position} />
            </TableCell>
            <TableCell className="text-center">
              <PositionChange
                position={entry.position}
                prev_position={entry.prev_position}
              />
            </TableCell>
            <TableCell className="font-medium">{entry.displayname}</TableCell>
            <TableCell className="text-center">
              <DisplayRank
                rank_level={entry.rank_level}
                rank_image={entry.rank_image ?? "bronze.png"}
                rank_name={`Lv.${entry.rank_level}`}
              />
            </TableCell>
            <TableCell className="text-right font-mono">
              {entry.ranking_point.toFixed(1)}
            </TableCell>
            <TableCell className="text-right">{entry.trade_count}</TableCell>
            <TableCell className="text-right">
              {entry.trade_rate.toFixed(1)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const LeaderboardWidget = () => {
  const [period, setPeriod] = useState("total");

  return (
    <div className="w-full space-y-4">
      <h1 className="text-2xl font-bold">랭킹</h1>
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          {periods.map((p) => (
            <TabsTrigger key={p.value} value={p.value}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {periods.map((p) => (
          <TabsContent key={p.value} value={p.value}>
            <LeaderboardTable period={p.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LeaderboardWidget;
