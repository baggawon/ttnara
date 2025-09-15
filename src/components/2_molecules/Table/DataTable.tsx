"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  Table as TableType,
  ColumnFiltersState,
  PaginationState,
  HeaderGroup,
  Row,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImperativeHandle, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { DataTablePagination } from "@/components/2_molecules/Table/DataTablePagination";
import { DataTableViewOptions } from "@/components/2_molecules/Table/DataTableViewOptions";
import { SearchIcon, X } from "lucide-react";
import { filterMap, forEach, isArray, map } from "@/helpers/basic";
import { DataTableFacetedFilter } from "@/components/2_molecules/Table/FacetedFilter";
import { Button } from "@/components/ui/button";
import useSearch from "@/helpers/customHook/useSearch";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { isDifference } from "@/helpers/basic";
import useLoading from "@/helpers/customHook/useLoading";
import clsx from "clsx";
import { SortableTable } from "@/components/2_molecules/Table/Sortable";
import { cn } from "@/components/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GnuboardPagination } from "@/components/2_molecules/Table/GnuboardPagination";

export interface DataTableProps<TData, TValue> {
  columns: (CustomColumDef<TData, TValue> & { className?: string })[];
  data: TData[];
}

export type CustomColumDef<TData = any, TValue = any> = ColumnDef<
  TData,
  TValue
> & {
  option?: { [key: string]: any };
  accessorKey?: string;
  className?: string;
  visible?: boolean;
  cellClassName?: string;
  colSpan?: number;
  convertValue?: (value: any) => any;
  useRowSelect?: boolean;
  headerTitle?: string;
  headerClassName?: string;
};

export interface TableSettings {
  columnVisibility?: VisibilityState;
  columnFilters?: ColumnFiltersState;
  columnOrder?: string[];
}

export interface TableRef<T> {
  table: TableType<T>;
  resetInput: (value?: string) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  viewData,
  placeholder = "데이터가 없습니다.",
  searchPlaceholder = "검색어를 입력하세요.",
  onPagination,
  onSort,
  initialPageSize,
  tableRef,
  initialSelectedRows,
  uidColumn,
  rowDisabled,
  rowAccordionContent,
  beforeSearch,
  beforeButtons,
  afterButtons,
  settings,
  className,
  onRowSelected,
  onRowClassName,
  onRowClick,
  onSearchClear,
  excludeColumns,
  useCard,
  useColumnSort,
  useTop = true,
  useHeader = true,
  useAccordion,
  useFooter = true,
  useGnuboard,
}: DataTableProps<TData, TValue> & {
  viewData?: TData[];
  placeholder?: ReactNode;
  searchPlaceholder?: string;
  onPagination?: (state: PaginationState) => void;
  onSort?: (state: SortingState) => void;
  initialPageSize?: number;
  tableRef?: RefObject<TableRef<TData>>;
  initialSelectedRows?: string[];
  uidColumn?: string;
  rowAccordionContent?: (row: TData) => ReactNode;
  rowDisabled?: (row: TData) => boolean;
  beforeSearch?: ReactNode;
  beforeButtons?: ReactNode;
  afterButtons?: ReactNode;
  settings?: TableSettings;
  className?: string;
  onRowSelected?: (selectedList: TData[]) => void;
  onRowClassName?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  onSearchClear?: () => void;
  excludeColumns?: string[];
  useCard?: boolean;
  useColumnSort?: boolean;
  useTop?: boolean;
  useHeader?: boolean;
  useAccordion?: boolean;
  useFooter?: boolean;
  useGnuboard?: boolean;
}) {
  const firstColumnVisibility = settings?.columnVisibility ?? {};
  forEach(columns, (column) => {
    if (column?.visible === false) {
      firstColumnVisibility[column.id ?? column.accessorKey!] = false;
    }
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    firstColumnVisibility
  );
  const [initData, setInitData] = useState<TData[]>(data);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    settings?.columnFilters ?? []
  );
  const { isSearch, searchItem, searchRegister, resetInput } = useSearch({
    originalData: initData,
    columns,
    excludeColumns,
  });

  const firstColumnOrder =
    settings?.columnOrder ??
    map(columns, (column) => column.id ?? column.accessorKey!);
  forEach(columns, (column) => {
    const id = column.id ?? column.accessorKey!;
    if (!firstColumnOrder.includes(id)) {
      firstColumnOrder.unshift(id);
    }
  });

  const [columnOrder, setColumnOrderAction] =
    useState<string[]>(firstColumnOrder);
  const { loading } = useLoading();

  useEffectFunctionHook({
    Function: () => {
      if (isArray(columnFilters, ">", 0)) {
        const filteredDatas = filterMap(
          data,
          (row: any) =>
            columnFilters.every((filter: any) => {
              const convertValue = filter.value[0].includes("*&*")
                ? filter.value[0]
                : filter.value;
              return convertValue.includes(row?.[filter.id]);
            }) && row
        );
        if (isDifference(filteredDatas, initData)) {
          setInitData(filteredDatas);
        }
      }
      if (isArray(columnFilters, "===", 0)) {
        setInitData(data);
      }
    },
    dependency: [data, initData, columnFilters],
  });

  const filteredData = isSearch ? searchItem : (viewData ?? initData);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: filteredData,
    columns,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrderAction,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      rowSelection,
      columnOrder,
    },
  });
  useImperativeHandle(tableRef, () => ({
    table,
    resetInput,
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
        onRowSelected(
          filteredData.filter((_, index) => indexs.includes(index))
        );
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

  useEffectFunctionHook({
    Function: () => {
      if (initialPageSize) table.setPageSize(initialPageSize);
    },
    dependency: [],
  });

  const prevData = useRef(data);
  const prevPage = useRef(table.getState().pagination.pageIndex);
  const needKeepPageIndex = useRef(false);

  useEffectFunctionHook({
    Function: () => {
      if (isDifference(data, prevData.current)) {
        prevData.current = data;
        needKeepPageIndex.current = true;
      }
    },
    dependency: [data],
  });

  useEffectFunctionHook({
    Function: () => {
      const state = table.getState();
      if (needKeepPageIndex.current && prevPage.current >= 0) {
        table.setPageIndex(prevPage.current);
        needKeepPageIndex.current = false;
      } else {
        prevPage.current = state.pagination.pageIndex;
      }
      onPagination?.(state.pagination);
      onSort?.(state.sorting);
    },
    dependency: [table.getState().pagination, table.getState().sorting],
  });

  const optionHeaders = columns.filter((header: any) => header.option);

  return (
    <div className={clsx(className, useGnuboard && "flex flex-col gap-4")}>
      {useGnuboard && (
        <>
          <DefaultTable
            table={table}
            loading={loading}
            placeholder={placeholder}
            onRowClassName={onRowClassName}
            onRowClick={onRowClick}
            useHeader={useHeader}
            className={clsx(
              "border-l-0 border-r-0 border-t-4 border-t-gray-400",
              "[&>div>table>thead]:bg-gray-200"
            )}
          />
          <GnuboardPagination
            table={table}
            useRowSelect={columns.some((column) => column.useRowSelect)}
          />
          <div className="flex justify-center gap-4 w-full">
            {beforeSearch && beforeSearch}
            <div className="relative w-full sm:w-[228px]">
              <Input
                ref={searchRegister.searchControllRef}
                placeholder={searchPlaceholder}
                onChange={searchRegister.onSearchItem}
                className="w-full"
              />

              <SearchIcon
                width={20}
                height={20}
                className="absolute top-1/2 right-4 -translate-y-1/2"
              />
            </div>
          </div>
        </>
      )}
      {!useGnuboard && (
        <>
          {useTop && (
            <div className="flex items-start gap-4 lg:items-center py-4 flex-col-reverse lg:flex-row">
              {beforeSearch && beforeSearch}
              <div className="relative w-full sm:w-[328px]">
                <Input
                  ref={searchRegister.searchControllRef}
                  placeholder={searchPlaceholder}
                  onChange={searchRegister.onSearchItem}
                  className="w-full"
                />

                <SearchIcon
                  width={20}
                  height={20}
                  className="absolute top-1/2 right-4 -translate-y-1/2"
                />
              </div>
              {isArray(optionHeaders, ">", 0) ? (
                <div className="flex justify-start space-x-2 ml-2">
                  {isSearch && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        resetInput();
                        onSearchClear?.();
                      }}
                      className="h-10 px-2 lg:px-3 whitespace-nowrap"
                    >
                      초기화
                      <X className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  {map(optionHeaders, (header: any) => {
                    const id = header.id ?? header.accessorKey;
                    const title = header.header({
                      column: undefined,
                    });
                    return (
                      <DataTableFacetedFilter
                        key={`${id}_optionHeader`}
                        column={table.getColumn(id)}
                        data={data}
                        title={title}
                        options={header.option}
                      />
                    );
                  })}
                </div>
              ) : (
                <>
                  {isSearch && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        resetInput();
                        onSearchClear?.();
                      }}
                      className="h-10 px-2 lg:px-3 ml-2 whitespace-nowrap"
                    >
                      초기화
                      <X className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              <DataTableViewOptions
                table={table}
                beforeButtons={beforeButtons}
                afterButtons={afterButtons}
              />
            </div>
          )}
          {!useCard && (
            <>
              {!useColumnSort ? (
                <DefaultTable
                  table={table}
                  loading={loading}
                  placeholder={placeholder}
                  onRowClassName={onRowClassName}
                  onRowClick={onRowClick}
                  useHeader={useHeader}
                />
              ) : (
                <SortableTable
                  table={table}
                  loading={loading}
                  placeholder={placeholder}
                  columnOrder={columnOrder}
                  setColumnOrderAction={setColumnOrderAction}
                  onRowClassName={onRowClassName}
                  onRowClick={onRowClick}
                  useHeader={useHeader}
                />
              )}
            </>
          )}
          {useCard && (
            <CardTable
              table={table}
              rowDisabled={rowDisabled}
              rowAccordionContent={rowAccordionContent}
              loading={loading}
              placeholder={placeholder}
              onRowClassName={onRowClassName}
              onRowClick={onRowClick}
              useHeader={useHeader}
              useAccordion={useAccordion}
            />
          )}
          {useFooter && (
            <DataTablePagination
              table={table}
              useRowSelect={columns.some((column) => column.useRowSelect)}
            />
          )}
        </>
      )}
    </div>
  );
}

export function DefaultTable<TData, TValue>({
  table,
  loading,
  placeholder,
  onRowClassName,
  onRowClick,
  useHeader,
  className,
  useSSR,
}: {
  table: TableType<TData>;
  loading: boolean;
  placeholder: ReactNode;
  onRowClassName?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  useHeader: boolean;
  className?: string;
  useSSR?: boolean;
}) {
  return (
    <BasicTable
      table={table}
      loading={loading}
      placeholder={placeholder}
      useHeader={useHeader}
      className={className}
      headGroupRenderAction={(headerGroup) => (
        <TableRow key={headerGroup.id}>
          {map(headerGroup.headers, (header) => (
            <TableHead
              key={header.id}
              className={clsx(
                "whitespace-nowrap",
                (header.column.columnDef as CustomColumDef<TData, TValue>)
                  .headerClassName
              )}
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
            </TableHead>
          ))}
        </TableRow>
      )}
      rowRenderAction={(row) => (
        <TableRow
          key={row.id}
          data-state={row.getIsSelected() && "selected"}
          className={cn(onRowClassName && onRowClassName(row.original))}
          onClick={() => {
            onRowClick?.(row.original);
          }}
        >
          {map(row.getVisibleCells(), (cell) => (
            <TableCell
              key={cell.id}
              colSpan={
                (cell.column.columnDef as CustomColumDef<TData, TValue>)
                  .colSpan ?? 1
              }
              className={clsx(
                (cell.column.columnDef as CustomColumDef<TData, TValue>)
                  .cellClassName
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      )}
      useSSR={useSSR}
    />
  );
}

export function BasicTable<TData>({
  table,
  loading,
  placeholder,
  headGroupRenderAction,
  rowRenderAction,
  useHeader,
  className,
  useSSR,
}: {
  table: TableType<TData>;
  loading: boolean;
  placeholder: ReactNode;
  headGroupRenderAction: (headerGroup: HeaderGroup<TData>) => ReactNode;
  rowRenderAction: (row: Row<TData>) => ReactNode;
  useHeader: boolean;
  className?: string;
  useSSR?: boolean;
}) {
  const [isReady, setIsReady] = useState(false);
  useEffectFunctionHook({
    Function: () => {
      if (typeof table.getRowModel()?.rows?.length !== "undefined") {
        setIsReady(true);
      }
    },
    dependency: [table.getRowModel()],
  });

  return (
    <div className={clsx("w-full rounded-md border", className)}>
      <Table>
        {useHeader && (isReady || useSSR) ? (
          <TableHeader>
            {map(table.getHeaderGroups(), (headerGroup) =>
              headGroupRenderAction(headerGroup)
            )}
          </TableHeader>
        ) : (
          <></>
        )}
        <TableBody>
          {(isReady || useSSR) &&
          (table.getRowModel()?.rows?.length ?? 0) > 0 ? (
            map(table.getRowModel().rows, (row) => rowRenderAction(row))
          ) : (
            <TableRow>
              <TableCell
                className="h-24 w-full text-center"
                colSpan={
                  isReady || useSSR
                    ? table
                        .getHeaderGroups()
                        .reduce(
                          (acc, headerGroup) =>
                            acc + headerGroup.headers.length,
                          0
                        )
                    : 1
                }
              >
                {!loading && placeholder}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CardTable<TData, TValue>({
  table,
  rowDisabled,
  rowAccordionContent,
  loading,
  placeholder,
  onRowClassName,
  onRowClick,
  useHeader,
  useAccordion,
}: {
  table: TableType<TData>;
  rowDisabled?: (row: TData) => boolean;
  rowAccordionContent?: (row: TData) => ReactNode;
  loading: boolean;
  placeholder: ReactNode;
  onRowClassName?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  useHeader: boolean;
  useAccordion?: boolean;
}) {
  return (
    <div className="relative w-full overflow-auto">
      <div className="grid w-full">
        {useHeader && table.getRowModel()?.rows?.length ? (
          <div className="border-b w-full">
            {map(table.getHeaderGroups(), (headerGroup) => (
              <div
                key={headerGroup.id}
                className="flex justify-between items-center w-full"
              >
                {map(headerGroup.headers, (header) => {
                  return (
                    <div
                      key={header.id}
                      className={clsx(
                        "w-full p-4",
                        (header.column.columnDef as any).className
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <></>
        )}
        <div className="w-full">
          {table.getRowModel()?.rows?.length ? (
            map(table.getRowModel().rows, (row) => (
              <RowCard
                row={row}
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={clsx(
                  "w-full flex justify-between items-center",
                  "rounded-lg border bg-card text-card-foreground shadow-sm my-4",
                  "hover:bg-gray-100 hover:cursor-pointer",
                  rowDisabled && rowDisabled(row.original) && "opacity-50",
                  onRowClassName && onRowClassName(row.original),
                  useAccordion &&
                    "flex-col [&>h3]:w-full [&>h3>button>svg]:m-4 !items-start"
                )}
                onClick={() => {
                  if (rowDisabled && rowDisabled(row.original)) return;
                  row.toggleSelected(!row.getIsSelected());
                  onRowClick?.(row.original);
                }}
                useAccordion={useAccordion}
                rowAccordionContent={rowAccordionContent}
              >
                {map(
                  row.getVisibleCells(),
                  (cell) =>
                    (cell.column.columnDef as CustomColumDef<TData, TValue>)
                      .visible !== false && (
                      <div
                        key={cell.id}
                        className={clsx(
                          "w-full p-4",
                          (cell.column.columnDef as any).className
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    )
                )}
              </RowCard>
            ))
          ) : (
            <div>
              <div className="h-24 text-center relative flex items-center justify-center">
                {!loading && placeholder}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RowCard<TData>({
  row,
  children,
  useAccordion,
  rowAccordionContent,
  className,
  onClick,
  ...props
}: {
  row: Row<TData>;
  children: ReactNode;
  useAccordion?: boolean;
  rowAccordionContent?: (row: TData) => ReactNode;
  className: string;
  onClick: () => void;
}) {
  return useAccordion && rowAccordionContent ? (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1" className={className} {...props}>
        <AccordionTrigger className="w-full">{children}</AccordionTrigger>
        <AccordionContent>{rowAccordionContent(row.original)}</AccordionContent>
      </AccordionItem>
    </Accordion>
  ) : (
    <div className={className} onClick={onClick} {...props}>
      {children}
    </div>
  );
}
