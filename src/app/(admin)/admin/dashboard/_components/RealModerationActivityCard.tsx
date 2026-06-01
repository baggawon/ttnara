import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, VolumeX } from "lucide-react";

import { handleConnect } from "@/helpers/server/prisma";
import { now } from "@/helpers/basic";

const ACTION_LABELS: Record<string, string> = {
  mute: "음소거",
  unmute: "음소거 해제",
  ban: "채팅 차단",
  unban: "차단 해제",
  hide: "메시지 숨김",
  unhide: "숨김 해제",
  fixed_set: "고정 메시지 설정",
  fixed_unset: "고정 메시지 해제",
  topic_delete: "토픽 삭제",
  spam_warning: "스팸 경고",
  spam_penalty_1: "스팸 제재 1단계",
  spam_penalty_2: "스팸 제재 2단계",
  spam_penalty_3: "스팸 제재 3단계",
};

const actionLabel = (action: string): string => ACTION_LABELS[action] ?? action;

export async function RealModerationActivityCard() {
  const sevenDaysAgo = now().subtract(7, "day").toDate();
  const nowDate = now().toDate();

  const result = await handleConnect(async (prisma) => {
    const [mutedNow, grouped] = await Promise.all([
      prisma.chat_muted_user.count({ where: { until: { gt: nowDate } } }),
      prisma.chat_moderation_log.groupBy({
        by: ["action"],
        where: { created_at: { gte: sevenDaysAgo } },
        _count: { _all: true },
      }),
    ]);

    const actions = grouped
      .map((g) => ({ action: g.action, count: g._count._all }))
      .sort((a, b) => b.count - a.count);
    const total = actions.reduce((sum, a) => sum + a.count, 0);

    return { mutedNow, actions, total };
  });

  const mutedNow = result?.mutedNow ?? 0;
  const actions = result?.actions ?? [];
  const total = result?.total ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> 모더레이션 활동
        </CardTitle>
        <p className="text-xs text-muted-foreground">최근 7일 조치 내역</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
          <VolumeX className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="flex-1">현재 음소거</span>
          <span className="font-bold">{mutedNow.toLocaleString()}명</span>
        </div>

        {total === 0 ? (
          <div className="py-4 text-sm text-muted-foreground text-center">
            최근 7일간 조치 내역이 없습니다.
          </div>
        ) : (
          <ul className="text-sm space-y-1.5">
            {actions.map((a) => (
              <li key={a.action} className="flex items-center gap-2">
                <span className="flex-1 truncate">{actionLabel(a.action)}</span>
                <span className="font-medium">{a.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
