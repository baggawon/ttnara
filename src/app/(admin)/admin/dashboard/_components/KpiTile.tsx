import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import clsx from "clsx";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface KpiTileProps {
  label: string;
  value: string | number;
  /** Signed delta vs comparison period (e.g. +12.4 for +12.4%). */
  deltaPercent?: number;
  /** What the delta is being compared to ("어제 대비", "지난 주 대비"). */
  deltaLabel?: string;
  icon?: ReactNode;
  /** Footer hint, e.g. "처리 필요". */
  hint?: string;
  /** Optional footer label; omit to hide the footer entirely. */
  footer?: string;
}

export function KpiTile({
  label,
  value,
  deltaPercent,
  deltaLabel,
  icon,
  hint,
  footer,
}: KpiTileProps) {
  const showDelta = deltaPercent !== undefined;
  const isUp = (deltaPercent ?? 0) >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {showDelta && (
          <div
            className={clsx(
              "inline-flex items-center gap-0.5 text-xs",
              isUp ? "text-emerald-600" : "text-red-600"
            )}
          >
            {isUp ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(deltaPercent!).toFixed(1)}%
            {deltaLabel && (
              <span className="text-muted-foreground ml-1">{deltaLabel}</span>
            )}
          </div>
        )}
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
      {footer && (
        <CardFooter className="text-[10px] text-muted-foreground border-t pt-2">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
