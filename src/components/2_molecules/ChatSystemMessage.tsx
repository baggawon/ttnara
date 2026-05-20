"use client";

import { memo, useEffect, useState } from "react";
import type { ChatSystemMessage } from "@/helpers/chatStore";
import { AlertTriangle, Clock, ShieldAlert, VolumeX } from "lucide-react";
import clsx from "clsx";

interface ChatSystemMessageProps {
  message: ChatSystemMessage;
}

const KIND_STYLES: Record<
  ChatSystemMessage["kind"],
  { icon: typeof AlertTriangle; tint: string }
> = {
  banned_word: {
    icon: ShieldAlert,
    tint: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  },
  spam_warning: {
    icon: AlertTriangle,
    tint: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  spam_penalty: {
    icon: Clock,
    tint: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  muted: {
    icon: VolumeX,
    tint: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  },
};

const formatRemaining = (ms: number) => {
  if (ms <= 0) return "곧";
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec < 60) return `${totalSec}초`;
  const min = Math.ceil(totalSec / 60);
  if (min < 60) return `${min}분`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin === 0 ? `${hr}시간` : `${hr}시간 ${remMin}분`;
};

const ChatSystemMessageItemImpl = ({ message }: ChatSystemMessageProps) => {
  const { icon: Icon, tint } = KIND_STYLES[message.kind];

  // Live countdown for time-bound notices. Tick once per second so the
  // "X초 남음" line stays accurate; auto-stop once the deadline passes.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!message.until) return;
    if (message.until <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [message.until]);

  const remainingMs =
    message.until !== null ? Math.max(0, message.until - now) : null;
  const showCountdown = remainingMs !== null && remainingMs > 0;

  return (
    <div className="px-2 py-1">
      <div
        className={clsx(
          "flex items-start gap-1.5 rounded-md border px-2 py-1.5 text-[11px]",
          tint
        )}
      >
        <Icon className="w-3 h-3 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 [overflow-wrap:anywhere]">
          <div>{message.message}</div>
          {showCountdown && (
            <div className="opacity-80 mt-0.5">
              {formatRemaining(remainingMs!)} 후 다시 시도할 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ChatSystemMessageItem = memo(ChatSystemMessageItemImpl);
