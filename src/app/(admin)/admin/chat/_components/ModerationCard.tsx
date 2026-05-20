"use client";

import type { ReactNode } from "react";
import { cn } from "@/components/lib/utils";

interface ModerationCardProps {
  title: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function ModerationCard({
  title,
  meta,
  badges,
  body,
  actions,
  className,
}: ModerationCardProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium break-words min-w-0">{title}</div>
        {meta && (
          <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {meta}
          </div>
        )}
      </div>
      {badges && (
        <div className="flex flex-wrap items-center gap-1">{badges}</div>
      )}
      {body && (
        <div className="text-sm break-words text-foreground/90">{body}</div>
      )}
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-1 pt-1">
          {actions}
        </div>
      )}
    </div>
  );
}
