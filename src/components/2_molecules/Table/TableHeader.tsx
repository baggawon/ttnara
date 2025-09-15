import type { Column } from "@tanstack/react-table";
import { ChevronsUpDown, EyeOff, SortAsc, SortDesc } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from "clsx";
import type { ReactNode } from "react";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column?: Column<TData, TValue>;
  title?: string;
  titleChildren?: ReactNode;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  titleChildren,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const isNotSortable = !column?.getCanSort();
  if (isNotSortable) {
    return !titleChildren ? (
      <div className={clsx(className)}>{title}</div>
    ) : (
      <>{titleChildren}</>
    );
  }

  return column ? (
    <div className={clsx("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          id={title ?? JSON.stringify(titleChildren)}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-mx-3 h-8 data-[state=open]:bg-accent"
          >
            {!titleChildren ? <span>{title}</span> : titleChildren}
            {column.getIsSorted() === "desc" ? (
              <SortDesc className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <SortAsc className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <SortAsc className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <SortDesc className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    <>{title}</>
  );
}
