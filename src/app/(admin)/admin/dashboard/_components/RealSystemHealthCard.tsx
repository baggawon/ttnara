import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck, CircleAlert, Database } from "lucide-react";

import { handleConnect } from "@/helpers/server/prisma";
import { now } from "@/helpers/basic";

interface Row {
  name: string;
  ok: boolean;
  detail: string;
}

// A background dispatcher is expected to drain notification_queue promptly; an
// overdue item older than this suggests the dispatcher is stuck/down.
const NOTIFICATION_STUCK_MIN = 15;

export async function RealSystemHealthCard() {
  const nowDate = now().toDate();
  const rows: Row[] = [];

  const dbStart = Date.now();
  const data = await handleConnect(async (prisma) => {
    const [
      lastMessage,
      lastLogin,
      lastLeaderboard,
      overdueCount,
      oldestOverdue,
    ] = await Promise.all([
      prisma.chat_message.findFirst({
        orderBy: { created_at: "desc" },
        select: { created_at: true },
      }),
      prisma.login_history.findFirst({
        orderBy: { created_at: "desc" },
        select: { created_at: true },
      }),
      prisma.leaderboard_entry.findFirst({
        orderBy: { updated_at: "desc" },
        select: { updated_at: true },
      }),
      prisma.notification_queue.count({
        where: { dispatched: false, dispatch_after: { lt: nowDate } },
      }),
      prisma.notification_queue.findFirst({
        where: { dispatched: false, dispatch_after: { lt: nowDate } },
        orderBy: { dispatch_after: "asc" },
        select: { dispatch_after: true },
      }),
    ]);
    return {
      lastMessage,
      lastLogin,
      lastLeaderboard,
      overdueCount,
      oldestOverdue,
    };
  });
  const dbMs = Date.now() - dbStart;

  rows.push({
    name: "데이터베이스",
    ok: !!data,
    detail: data ? `핑 ${dbMs}ms` : "연결 실패",
  });

  const lastChat = data?.lastMessage?.created_at;
  rows.push({
    name: "채팅 메시지",
    ok: !!lastChat,
    detail: lastChat ? `최근 ${formatRelative(lastChat)}` : "데이터 없음",
  });

  const lastLogin = data?.lastLogin?.created_at;
  rows.push({
    name: "로그인 활동",
    ok: !!lastLogin,
    detail: lastLogin ? `최근 ${formatRelative(lastLogin)}` : "데이터 없음",
  });

  const lastBoard = data?.lastLeaderboard?.updated_at;
  rows.push({
    name: "랭킹 갱신",
    ok: !!lastBoard,
    detail: lastBoard ? `최근 ${formatRelative(lastBoard)}` : "데이터 없음",
  });

  const overdueCount = data?.overdueCount ?? 0;
  const oldestOverdue = data?.oldestOverdue?.dispatch_after ?? null;
  const overdueMin = oldestOverdue
    ? Math.floor((nowDate.getTime() - oldestOverdue.getTime()) / 60000)
    : 0;
  rows.push({
    name: "알림 큐",
    ok: overdueCount === 0 || overdueMin < NOTIFICATION_STUCK_MIN,
    detail:
      overdueCount === 0
        ? "정상"
        : `대기 ${overdueCount.toLocaleString()}건 · 최대 ${overdueMin}분 지연`,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4" /> 시스템 상태
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          DB · 활동 · 백그라운드 작업
        </p>
      </CardHeader>
      <CardContent>
        <ul className="text-sm space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-2">
              {r.ok ? (
                <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <CircleAlert className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className="flex-1 truncate">{r.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {r.detail}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function formatRelative(when: Date): string {
  const diffMin = Math.max(
    0,
    Math.floor((Date.now() - when.getTime()) / 60000)
  );
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}
