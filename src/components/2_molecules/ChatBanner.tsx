"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

type ChatBannerAccent = "notice" | "fixed";

const accentStyles: Record<
  ChatBannerAccent,
  { container: string; content: string; toggle: string }
> = {
  notice: {
    container: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
    content: "text-blue-600 dark:text-blue-400",
    toggle: "text-blue-400 hover:text-blue-700 dark:hover:text-blue-200",
  },
  fixed: {
    container:
      "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
    content: "text-amber-700 dark:text-amber-300",
    toggle: "text-amber-500 hover:text-amber-700 dark:hover:text-amber-200",
  },
};

interface ChatBannerProps {
  accent: ChatBannerAccent;
  icon: ReactNode;
  content: string;
  title?: string | null;
  /**
   * Optional controls rendered in the bottom row, aligned to the right
   * (e.g. carousel prev/next + page counter). Placing them below the text —
   * rather than beside it — keeps the content at full width.
   */
  controls?: ReactNode;
  /** Notified when the banner expands/collapses (e.g. to pause rotation). */
  onExpandedChange?: (expanded: boolean) => void;
}

/**
 * Shared banner row for the chat widget. Used by both the notice carousel
 * (채팅 공지) and the pinned message (고정 메시지) so they truncate and expand
 * identically: content is clamped to 2 lines, with a tap-to-expand toggle
 * shown only when the text actually overflows.
 */
export const ChatBanner = ({
  accent,
  icon,
  content,
  title,
  controls,
  onExpandedChange,
}: ChatBannerProps) => {
  const styles = accentStyles[accent];
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  // Collapse whenever the content changes (e.g. the carousel rotates to the
  // next notice) so a long previous notice doesn't leave the row expanded.
  useEffect(() => {
    setExpanded(false);
    onExpandedChange?.(false);
  }, [content, title, onExpandedChange]);

  // Measure overflow against the clamped layout. Skip while expanded — the
  // clamp is removed then, so the measurement is meaningless; keep the prior
  // value until the row collapses again.
  useLayoutEffect(() => {
    if (expanded) return;
    const el = contentRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [content, title, expanded]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <div
      className={clsx(
        "flex items-start gap-1.5 px-3 py-1.5 border-b text-xs overflow-hidden",
        styles.container
      )}
    >
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold truncate">{title}</div>}
        <div
          ref={contentRef}
          className={clsx(
            "text-[11px] [overflow-wrap:anywhere]",
            styles.content,
            !expanded && "line-clamp-2"
          )}
        >
          {content}
        </div>
        {(overflowing || controls) && (
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className="min-w-0">
              {overflowing && (
                <button
                  type="button"
                  onClick={toggle}
                  className={clsx(
                    "flex items-center gap-0.5 text-[10px] transition-colors",
                    styles.toggle
                  )}
                >
                  {expanded ? "접기" : "더보기"}
                  <ChevronDown
                    className={clsx(
                      "w-3 h-3 transition-transform",
                      expanded && "rotate-180"
                    )}
                  />
                </button>
              )}
            </span>
            {controls && <span className="shrink-0">{controls}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
