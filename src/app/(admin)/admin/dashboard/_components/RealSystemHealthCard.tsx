import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck, CircleAlert, Database } from "lucide-react";

import { handleConnect } from "@/helpers/server/prisma";

interface Row {
  name: string;
  ok: boolean;
  detail: string;
}

export async function RealSystemHealthCard() {
  const rows: Row[] = [];

  const dbStart = Date.now();
  const dbResult = await handleConnect(async (prisma) => {
    const lastMessage = await prisma.chat_message.findFirst({
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    });
    return { lastMessage };
  });
  const dbMs = Date.now() - dbStart;

  rows.push({
    name: "Database",
    ok: !!dbResult,
    detail: dbResult ? `ping ${dbMs}ms` : "연결 실패",
  });

  const lastChat = dbResult?.lastMessage?.created_at;
  rows.push({
    name: "채팅 메시지",
    ok: !!lastChat,
    detail: lastChat ? `최근 ${formatRelative(lastChat)}` : "데이터 없음",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4" /> 시스템 상태
        </CardTitle>
        <p className="text-xs text-muted-foreground">DB 핑 + 일반 설정</p>
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
