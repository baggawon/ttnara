"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import type { Table } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ReactNode } from "react";
import { map } from "@/helpers/basic";
import clsx from "clsx";
import { getColumnHeaderTitle } from "@/helpers/common";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
  beforeButtons,
  afterButtons,
}: DataTableViewOptionsProps<TData> & {
  beforeButtons?: ReactNode;
  afterButtons?: ReactNode;
}) {
  return (
    <div className="flex gap-2 w-full items-center justify-end">
      {beforeButtons && beforeButtons}
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger
                id="dataTableViewOption"
                className={clsx(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  !beforeButtons && "ml-auto",
                  "hidden !h-10 lg:flex"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>헤더 숨기기/보이기</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="w-[150px]">
          {map(
            table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  (column.columnDef as any)?.visible !== false &&
                  column.getCanHide()
              ),
            (column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {getColumnHeaderTitle(column)}
              </DropdownMenuCheckboxItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {afterButtons && afterButtons}
    </div>
  );
}
