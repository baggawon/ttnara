"use client";

import type { ReactNode } from "react";
import { cn } from "@/components/lib/utils";

export interface ResponsiveColumn {
  header: ReactNode;
  className?: string;
  align?: "left" | "right";
}

export interface ResponsiveRow {
  key: string | number;
  cells: ReactNode[];
  mobile: ReactNode;
}

interface ResponsiveTableProps {
  columns: ResponsiveColumn[];
  rows: ResponsiveRow[];
  emptyMessage?: ReactNode;
  className?: string;
}

export default function ResponsiveTable({
  columns,
  rows,
  emptyMessage = "데이터가 없습니다.",
  className,
}: ResponsiveTableProps) {
  const isEmpty = rows.length === 0;

  return (
    <>
      <table className={cn("hidden md:table w-full text-sm", className)}>
        <thead className="text-xs text-muted-foreground border-b">
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className={cn(
                  "py-2 pr-2",
                  c.align === "right" ? "text-right" : "text-left",
                  c.className
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b align-top">
              {r.cells.map((cell, i) => (
                <td
                  key={i}
                  className={cn(
                    "py-2 pr-2",
                    columns[i]?.align === "right" && "text-right"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {isEmpty && (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-6 text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ul className={cn("md:hidden space-y-2", className)}>
        {rows.map((r) => (
          <li key={r.key} className="rounded-md border p-3 text-sm bg-card">
            {r.mobile}
          </li>
        ))}
        {isEmpty && (
          <li className="text-center py-6 text-muted-foreground text-sm">
            {emptyMessage}
          </li>
        )}
      </ul>
    </>
  );
}
