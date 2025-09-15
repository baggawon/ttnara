"use client";

import { Button } from "@/components/ui/button";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { useState } from "react";
import type { PaginationInfo } from "@/helpers/types";
import type { Table } from "@tanstack/react-table";
import { PAGINAGION_SIZE } from "@/helpers/config";
import {
  ChevronFirstIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronLastIcon,
} from "lucide-react";

interface DataTablePaginationProps<TData> {
  table?: Table<TData>;
  pagination?: PaginationInfo;
  useRowSelect?: boolean;
  setPageIndexAction: (index: number) => void;
  topicPageNavSize?: number;
}

export function GnuboardPaginationSSR<TData>({
  table,
  pagination,
  useRowSelect,
  setPageIndexAction,
  topicPageNavSize,
}: DataTablePaginationProps<TData>) {
  const [isReady, setIsReady] = useState(false);

  useEffectFunctionHook({
    Function: () => {
      if (pagination) {
        setIsReady(true);
      }
    },
    dependency: [pagination],
  });

  return isReady ? (
    <div className="flex flex-col md:flex-row items-center justify-between px-0 mt-0 md:mt-2 gap-2">
      {useRowSelect !== false && table && (
        <div className="text-sm text-muted-foreground">
          전체 {table.getFilteredRowModel().rows.length} 중&nbsp;
          {table.getFilteredSelectedRowModel().rows.length} 열 선택.
        </div>
      )}
      <div className="flex flex-col md:flex-row flex-1 justify-between items-center gap-y-2 gap-x-4 lg:gap-x-8">
        <div className="w-full flex gap-1 justify-center flex-wrap">
          {pagination?.currentPage !== 1 && pagination?.totalPages !== 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-8 w-6 p-0"
              onClick={() => setPageIndexAction(1)}
            >
              <ChevronFirstIcon className="h-4 w-4" />
            </Button>
          )}
          {pagination?.hasPreviousPage === true && (
            <Button
              type="button"
              variant="outline"
              className="h-8 w-6 p-0"
              onClick={() =>
                setPageIndexAction(
                  (Math.floor(
                    (pagination!.currentPage % PAGINAGION_SIZE === 0
                      ? pagination!.currentPage - 1
                      : pagination!.currentPage) / PAGINAGION_SIZE
                  ) -
                    1) *
                    PAGINAGION_SIZE +
                    PAGINAGION_SIZE
                )
              }
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          )}
          <div className="flex w-fit items-center justify-center text-sm font-medium gap-[0.125rem] sm:gap-1">
            {(() => {
              const currentPage = pagination?.currentPage ?? 1;
              const totalPages = pagination?.totalPages ?? 1;
              const navSize = topicPageNavSize ?? PAGINAGION_SIZE;
              const halfSize = Math.floor(navSize / 2);

              let startPage = Math.max(1, currentPage - halfSize);
              const endPage = Math.min(totalPages, startPage + navSize - 1);

              // Adjust start page if we're near the end
              if (endPage - startPage + 1 < navSize) {
                startPage = Math.max(1, endPage - navSize + 1);
              }

              return Array.from(
                { length: endPage - startPage + 1 },
                (_, index) => {
                  const pageNumber = startPage + index;
                  return (
                    <Button
                      type="button"
                      key={`pagination${pageNumber}`}
                      variant={
                        currentPage !== pageNumber ? "outline" : "default"
                      }
                      className="h-8 w-6 md:w-8 p-0"
                      onClick={() => setPageIndexAction(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                }
              );
            })()}
          </div>
          {pagination?.hasNextPage && (
            <Button
              type="button"
              variant="outline"
              className="h-8 w-6 p-0"
              onClick={() =>
                setPageIndexAction(
                  (Math.floor(
                    (pagination.currentPage % PAGINAGION_SIZE === 0
                      ? pagination.currentPage - 1
                      : pagination.currentPage) / PAGINAGION_SIZE
                  ) +
                    1) *
                    PAGINAGION_SIZE +
                    1
                )
              }
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          )}
          {pagination?.currentPage !== (pagination?.totalPages ?? 1) &&
            pagination?.totalPages !== 0 && (
              <Button
                type="button"
                variant="outline"
                className="h-8 w-6 p-0"
                onClick={() => setPageIndexAction(pagination?.totalPages ?? 1)}
              >
                <ChevronLastIcon className="h-4 w-4" />
              </Button>
            )}
        </div>
      </div>
    </div>
  ) : null;
}
