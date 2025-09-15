"use client";

import {
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  DefaultTable,
  type DataTableProps,
} from "@/components/2_molecules/Table/DataTable";
import type {
  Table as TableType,
  VisibilityState,
} from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { filterMap, forEach, isArray } from "@/helpers/basic";
import useLoading from "@/helpers/customHook/useLoading";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import clsx from "clsx";
import { GnuboardPaginationSSR } from "@/components/2_molecules/Table/GnuboardPaginationSSR";
import type { PaginationInfo } from "@/helpers/types";

export interface SSrTableRef<T> {
  table: TableType<T>;
  setColumnVisibility: (visibility: VisibilityState) => void;
}

export function DataTableSSR<TData, TValue>({
  columns,
  data,
  placeholder = "데이터가 없습니다.",
  tableRef,
  initialSelectedRows,
  uidColumn,
  className,
  onRowSelected,
  onRowClassName,
  onRowClick,
  useHeader = true,
  setPageIndexAction,
  pagination,
  topicPageNavSize,
}: DataTableProps<TData, TValue> & {
  placeholder?: ReactNode;
  tableRef?: RefObject<SSrTableRef<TData> | null>;
  initialSelectedRows?: string[];
  uidColumn?: string;
  className?: string;
  onRowSelected?: (selectedList: TData[]) => void;
  onRowClassName?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  useHeader?: boolean;
  setPageIndexAction: (index: number) => void;
  pagination?: PaginationInfo;
  topicPageNavSize?: number;
}) {
  const { loading } = useLoading();
  const [rowSelection, setRowSelection] = useState({});

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      rowSelection,
      columnVisibility,
    },
  });
  useImperativeHandle(tableRef, () => ({
    table,
    setColumnVisibility,
  }));

  const loadFinish = useRef(false);

  const firstOnRowSelected = useRef(true);
  useEffectFunctionHook({
    Function: () => {
      if (
        isArray(data) &&
        onRowSelected &&
        ((uidColumn && loadFinish.current) || !uidColumn)
      ) {
        const indexs = filterMap(
          Object.entries(rowSelection),
          ([index, bool]) => bool && Number(index)
        );
        if (firstOnRowSelected.current) {
          firstOnRowSelected.current = false;
          return;
        }
        onRowSelected(data.filter((_, index) => indexs.includes(index)));
      }
    },
    dependency: [data, onRowSelected, initialSelectedRows, rowSelection],
  });

  useEffectFunctionHook({
    Function: () => {
      if (isArray(data)) {
        if (isArray(initialSelectedRows) && uidColumn) {
          const selectedRows: any = {};
          forEach(data, (row: any, index) => {
            if (initialSelectedRows.includes(row[uidColumn])) {
              selectedRows[index] = true;
            }
          });
          setRowSelection(selectedRows);
        }
        loadFinish.current = true;
      }
    },
    dependency: [data, initialSelectedRows],
  });

  return (
    <div className={clsx(className, "flex flex-col gap-2")}>
      <DefaultTable
        table={table}
        loading={loading}
        placeholder={placeholder}
        onRowClassName={onRowClassName}
        onRowClick={onRowClick}
        useHeader={useHeader}
        className={clsx(
          "border-l-0 border-r-0 border-t-4 border-t-gray-400 rounded-none",
          "[&>div>table>thead]:bg-gray-200 [&>div>table]:w-full [&>div>table]:table-fixed"
        )}
        useSSR={true}
      />
      <GnuboardPaginationSSR
        table={table}
        pagination={pagination}
        useRowSelect={columns.some((column) => column.useRowSelect)}
        setPageIndexAction={setPageIndexAction}
        topicPageNavSize={topicPageNavSize}
      />
    </div>
  );
}
