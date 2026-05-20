import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

import { handleConnect } from "@/helpers/server/prisma";

export async function RealTopTradersCard() {
  const rows = await handleConnect(async (prisma) => {
    const entries = await prisma.leaderboard_entry.findMany({
      where: { period_type: "total", period_key: "all" },
      orderBy: [{ ranking_point: "desc" }, { updated_at: "asc" }],
      take: 5,
      select: {
        uid: true,
        ranking_point: true,
        trade_count: true,
        trade_rate: true,
        rank_level: true,
      },
    });
    if (entries.length === 0) return [];
    const profiles = await prisma.profile.findMany({
      where: { uid: { in: entries.map((e) => e.uid) } },
      select: { uid: true, displayname: true },
    });
    const nameByUid = new Map(profiles.map((p) => [p.uid, p.displayname]));
    return entries.map((e, i) => ({
      rank: i + 1,
      displayname: nameByUid.get(e.uid) ?? e.uid.slice(0, 8),
      trades: e.trade_count,
      rating: Number(e.trade_rate),
      rankLevel: e.rank_level,
    }));
  });

  const list = rows ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">상위 거래자</CardTitle>
        <p className="text-xs text-muted-foreground">누적 랭킹</p>
      </CardHeader>
      <CardContent className="px-0">
        {list.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">
            아직 랭킹 데이터가 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left px-4 py-1.5 w-8">#</th>
                <th className="text-left px-4 py-1.5">유저</th>
                <th className="text-right px-4 py-1.5">거래</th>
                <th className="text-right px-4 py-1.5">랭크</th>
                <th className="text-right px-4 py-1.5">평점</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.rank} className="border-b last:border-b-0">
                  <td className="px-4 py-2 text-muted-foreground">{t.rank}</td>
                  <td className="px-4 py-2 font-medium">{t.displayname}</td>
                  <td className="px-4 py-2 text-right">
                    {t.trades.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">Lv.{t.rankLevel}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {t.rating.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
