"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useChatStore } from "@/helpers/chatStore";
import { Info } from "lucide-react";

const ChatNoticeCarouselImpl = () => {
  // Subscribe only to notices, not the whole store.
  const notices = useChatStore((s) => s.notices);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeNotices = useMemo(
    () =>
      notices
        .filter((n) => n.content)
        .sort((a, b) => a.display_order - b.display_order),
    [notices]
  );

  useEffect(() => {
    if (activeNotices.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeNotices.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeNotices.length]);

  if (activeNotices.length === 0) return null;

  const current = activeNotices[activeIndex % activeNotices.length];
  if (!current) return null;

  return (
    <div className="flex items-start gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 border-b text-xs text-blue-700 dark:text-blue-300 overflow-hidden">
      <Info className="w-3 h-3 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {current.title && (
          <div className="font-semibold truncate">{current.title}</div>
        )}
        {current.content && (
          <div className="text-[11px] text-blue-600 dark:text-blue-400 line-clamp-2 [overflow-wrap:anywhere]">
            {current.content}
          </div>
        )}
      </div>
      {activeNotices.length > 1 && (
        <span className="shrink-0 text-[10px] text-blue-400 mt-0.5">
          {(activeIndex % activeNotices.length) + 1}/{activeNotices.length}
        </span>
      )}
    </div>
  );
};

export const ChatNoticeCarousel = memo(ChatNoticeCarouselImpl);
