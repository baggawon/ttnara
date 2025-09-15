"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { useState } from "react";
import { map } from "@/helpers/basic";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function GnuboardPagination<TData>({
  table,
  useRowSelect,
}: DataTablePaginationProps<TData> & {
  useRowSelect?: boolean;
}) {
  const [isReady, setIsReady] = useState(false);

  useEffectFunctionHook({
    Function: () => {
      if (table.getFilteredRowModel().rows.length) {
        setIsReady(true);
      }
    },
    dependency: [table.getFilteredRowModel()],
  });

  const canPreviousPage =
    (Math.floor(table.getState().pagination.pageIndex / 10) - 1) * 10 > -1;

  const canNextPage =
    (Math.floor(table.getState().pagination.pageIndex / 10) + 1) * 10 <
    table.getPageCount();

  return isReady ? (
    <div className="flex flex-col md:flex-row items-center justify-between px-2 mt-2 gap-2">
      {useRowSelect !== false && (
        <div className="text-sm text-muted-foreground">
          전체 {table.getFilteredRowModel().rows.length} 중&nbsp;
          {table.getFilteredSelectedRowModel().rows.length} 열 선택.
        </div>
      )}
      <div className="flex flex-col md:flex-row flex-1 justify-between items-center gap-y-2 gap-x-6 lg:gap-x-8">
        <div className="w-full flex gap-2 justify-center">
          {table.getState().pagination.pageIndex !== 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-8 w-10 !p-0"
              onClick={() => table.setPageIndex(0)}
            >
              처음
            </Button>
          )}
          {canPreviousPage && (
            <Button
              type="button"
              variant="outline"
              className="h-8 w-10 !p-0"
              onClick={() =>
                table.setPageIndex(
                  (Math.floor(table.getState().pagination.pageIndex / 10) - 1) *
                    10
                )
              }
            >
              이전
            </Button>
          )}
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            {map(10, (index) => {
              const convertIndex =
                table.getState().pagination.pageIndex > 9
                  ? Math.floor(table.getState().pagination.pageIndex / 10) *
                      10 +
                    index
                  : index;
              if (convertIndex + 1 <= table.getPageCount())
                return (
                  <Button
                    type="button"
                    key={`pagination${convertIndex}`}
                    variant={
                      table.getState().pagination.pageIndex !== convertIndex
                        ? "outline"
                        : "default"
                    }
                    className="h-8 w-8 !p-0"
                    onClick={() => table.setPageIndex(convertIndex)}
                  >
                    {convertIndex + 1}
                  </Button>
                );
            }).filter((component) => component)}
          </div>
          {canNextPage && (
            <Button
              type="button"
              variant="outline"
              className="h-8 w-10 !p-0"
              onClick={() =>
                table.setPageIndex(
                  (Math.floor(table.getState().pagination.pageIndex / 10) + 1) *
                    10
                )
              }
            >
              다음
            </Button>
          )}
          {table.getState().pagination.pageIndex !==
            table.getPageCount() - 1 && (
            <Button
              type="button"
              variant="outline"
              className="h-8 w-10 !p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            >
              맨끝
            </Button>
          )}
        </div>
      </div>
    </div>
  ) : null;
}
