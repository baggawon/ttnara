"use client";

import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "../../../../node_modules/lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { useState } from "react";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
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
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            <Input
              type="number"
              min="1"
              max={table.getPageCount()}
              value={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                if (e.target.value === "") return;
                const value = Number(e.target.value);
                if (value !== 0 && value <= table.getPageCount()) {
                  table.setPageIndex(value - 1);
                }
              }}
              style={{
                width:
                  String(String(table.getPageCount()).length * 0.6 + 1.5) +
                  "rem",
              }}
              className="mr-2"
            />
            /&nbsp;{table.getPageCount()}
          </div>
          <div className="flex items-center gap-x-2">
            <Button
              type="button"
              variant="outline"
              className="hidden h-8 w-8 !p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">시작으로</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 w-8 !p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">이전으로</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 w-8 !p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">다음으로</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="hidden h-8 w-8 !p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">끝으로</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          <p className="text-sm font-medium whitespace-nowrap">표시 개수</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  ) : null;
}
