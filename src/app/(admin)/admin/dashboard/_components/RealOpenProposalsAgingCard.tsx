import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

import { handleConnect } from "@/helpers/server/prisma";
import { now } from "@/helpers/basic";
import { TetherProposalStatus } from "@/helpers/types";

const DAY_MS = 24 * 60 * 60 * 1000;

interface AgeBucket {
  label: string;
  count: number;
  stale: boolean;
}

export async function RealOpenProposalsAgingCard() {
  const nowMs = now().valueOf();

  const result = await handleConnect(async (prisma) => {
    const rows = await prisma.tether_proposal.findMany({
      where: { status: TetherProposalStatus.Open },
      select: { created_at: true },
    });

    const buckets: AgeBucket[] = [
      { label: "24시간 이내", count: 0, stale: false },
      { label: "1–3일", count: 0, stale: false },
      { label: "3–7일", count: 0, stale: false },
      { label: "7일 이상", count: 0, stale: true },
    ];

    for (const row of rows) {
      const ageDays = (nowMs - row.created_at.getTime()) / DAY_MS;
      if (ageDays < 1) buckets[0].count += 1;
      else if (ageDays < 3) buckets[1].count += 1;
      else if (ageDays < 7) buckets[2].count += 1;
      else buckets[3].count += 1;
    }

    return { buckets, total: rows.length };
  });

  const buckets = result?.buckets ?? [];
  const total = result?.total ?? 0;
  const staleCount = buckets
    .filter((b) => b.stale)
    .reduce((sum, b) => sum + b.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">진행중 거래 경과</CardTitle>
        <p className="text-xs text-muted-foreground">
          오픈 상태 제안의 생성 후 경과 시간
        </p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="py-6 text-sm text-muted-foreground text-center">
            진행중인 거래가 없습니다.
          </div>
        ) : (
          <>
            <ul className="text-sm space-y-2">
              {buckets.map((b) => {
                const pct = total > 0 ? (b.count / total) * 100 : 0;
                return (
                  <li key={b.label} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex-1">{b.label}</span>
                      <span
                        className={
                          b.stale && b.count > 0
                            ? "font-medium text-amber-600"
                            : "font-medium"
                        }
                      >
                        {b.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={
                          b.stale ? "h-full bg-amber-500" : "h-full bg-sky-500"
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {staleCount > 0 && (
              <div className="mt-3 flex items-center gap-1.5 border-t pt-2 text-xs text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                7일 이상 미체결 {staleCount.toLocaleString()}건 — 확인 필요
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
