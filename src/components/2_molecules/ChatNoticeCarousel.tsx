"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useChatStore } from "@/helpers/chatStore";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { ChatBanner } from "@/components/2_molecules/ChatBanner";

const ChatNoticeCarouselImpl = () => {
  // Subscribe only to notices, not the whole store.
  const notices = useChatStore((s) => s.notices);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const activeNotices = useMemo(
    () =>
      notices
        .filter((n) => n.content)
        .sort((a, b) => a.display_order - b.display_order),
    [notices]
  );

  const count = activeNotices.length;

  const goTo = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => (prev + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    // Pause auto-rotation while a notice is expanded so it doesn't rotate
    // away mid-read. Depending on activeIndex also restarts the 5s timer
    // after a manual prev/next so it doesn't jump again immediately.
    if (count <= 1 || paused) return;
    const interval = setInterval(() => goTo(1), 5000);
    return () => clearInterval(interval);
  }, [count, paused, activeIndex, goTo]);

  if (count === 0) return null;

  const safeIndex = activeIndex % count;
  const current = activeNotices[safeIndex];
  if (!current) return null;

  return (
    <ChatBanner
      accent="notice"
      icon={<Info className="w-3 h-3" />}
      title={current.title}
      content={current.content}
      onExpandedChange={setPaused}
      controls={
        count > 1 ? (
          <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
            <button
              type="button"
              aria-label="이전 공지"
              onClick={() => goTo(-1)}
              className="p-0.5 rounded hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-200"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="tabular-nums">
              {safeIndex + 1}/{count}
            </span>
            <button
              type="button"
              aria-label="다음 공지"
              onClick={() => goTo(1)}
              className="p-0.5 rounded hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-200"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </span>
        ) : undefined
      }
    />
  );
};

export const ChatNoticeCarousel = memo(ChatNoticeCarouselImpl);
