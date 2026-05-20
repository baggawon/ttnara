import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { handleConnect } from "@/helpers/server/prisma";
import { now } from "@/helpers/basic";

const relativeLabel = (when: Date | null): string => {
  if (!when) return "-";
  const diffMin = Math.max(
    0,
    Math.floor((now().valueOf() - when.getTime()) / 60000)
  );
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
};

export async function RealTopicActivityCard() {
  const dayAgo = now().subtract(1, "day").toDate();

  const rows = await handleConnect(async (prisma) => {
    const topics = await prisma.chat_topic.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
      select: { id: true, name: true },
    });
    if (topics.length === 0) return [];

    const stats = await Promise.all(
      topics.map(async (t) => {
        const [messages24h, latest] = await Promise.all([
          prisma.chat_message.count({
            where: { topic_id: t.id, created_at: { gte: dayAgo } },
          }),
          prisma.chat_message.findFirst({
            where: { topic_id: t.id },
            orderBy: { created_at: "desc" },
            select: { created_at: true },
          }),
        ]);
        return {
          id: t.id,
          name: t.name,
          messages24h,
          lastActiveAt: latest?.created_at ?? null,
        };
      })
    );

    return stats.sort((a, b) => b.messages24h - a.messages24h);
  });

  const list = rows ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">채팅 토픽 활동</CardTitle>
        <p className="text-xs text-muted-foreground">최근 24시간 메시지 수</p>
      </CardHeader>
      <CardContent className="px-0">
        {list.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">
            활성 토픽이 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="text-left px-4 py-1.5">토픽</th>
                <th className="text-right px-4 py-1.5">메시지 (24h)</th>
                <th className="text-right px-4 py-1.5">최근</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2 font-medium">{t.name}</td>
                  <td className="px-4 py-2 text-right">
                    {t.messages24h.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {relativeLabel(t.lastActiveAt)}
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
