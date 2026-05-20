import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { handleConnect } from "@/helpers/server/prisma";
import { now } from "@/helpers/basic";
import { AdminAppRoute } from "@/helpers/types";

const TAKE = 5;

const relativeLabel = (when: Date): string => {
  const diffMin = Math.max(
    0,
    Math.floor((now().valueOf() - when.getTime()) / 60000)
  );
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
};

export async function RealRecentReportsCard() {
  const items = await handleConnect(async (prisma) => {
    const reports = await prisma.chat_report.findMany({
      orderBy: { created_at: "desc" },
      take: TAKE,
      select: {
        id: true,
        message_id: true,
        reason: true,
        created_at: true,
        reporter_id: true,
      },
    });
    if (reports.length === 0) return [];

    const messageIds = reports.map((r) => r.message_id);
    const reporterIds = reports.map((r) => r.reporter_id);
    const [messages, reporters] = await Promise.all([
      prisma.chat_message.findMany({
        where: { id: { in: messageIds } },
        select: { id: true, displayname: true, content: true, uid: true },
      }),
      prisma.profile.findMany({
        where: { uid: { in: reporterIds } },
        select: { uid: true, displayname: true },
      }),
    ]);
    const msgById = new Map(messages.map((m) => [m.id, m]));
    const reporterById = new Map(reporters.map((p) => [p.uid, p.displayname]));

    return reports.map((r) => {
      const msg = msgById.get(r.message_id);
      return {
        id: r.id,
        target: msg?.displayname ?? "(삭제된 메시지)",
        excerpt: msg?.content ?? "",
        reason: r.reason ?? "(사유 미기재)",
        reporter: reporterById.get(r.reporter_id) ?? "익명",
        when: r.created_at,
      };
    });
  });

  const list = items ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">최근 신고</CardTitle>
          <p className="text-xs text-muted-foreground">채팅 신고</p>
        </div>
        <Link href={AdminAppRoute.Chat}>
          <Button variant="outline" size="sm" className="text-xs">
            전체 보기
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {list.length === 0 ? (
          <div className="py-6 text-sm text-muted-foreground text-center">
            신고 내역이 없습니다.
          </div>
        ) : (
          list.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-3 py-1.5 border-b last:border-b-0"
            >
              <Badge variant="destructive" className="shrink-0">
                채팅
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.target}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.reason}
                  {r.excerpt && (
                    <span className="opacity-70">
                      {" "}
                      · &quot;{r.excerpt}&quot;
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                {relativeLabel(r.when)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
