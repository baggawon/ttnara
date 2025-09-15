"use client";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  Table as TableType,
  Header,
  Cell,
  Row,
  HeaderGroup,
} from "@tanstack/react-table";

// needed for row & cell level scope DnD setup
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { flexRender } from "@tanstack/react-table";
import {
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { BasicTable } from "@/components/2_molecules/Table/DataTable";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { ChevronsLeftRight } from "lucide-react";
import { cn } from "@/components/lib/utils";
import clsx from "clsx";

function DraggableTableHeader<TData>({
  header,
}: {
  header: Header<TData, unknown>;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: "width transform 0.2s ease-in-out",
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  const renderHeader = () =>
    header.isPlaceholder
      ? null
      : flexRender(header.column.columnDef.header, header.getContext());

  return (
    <TableHead
      key={header.id}
      ref={setNodeRef}
      className="whitespace-nowrap"
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex gap-2 items-center">
        {renderHeader()}
        <ChevronsLeftRight className="h-4 w-4" />
      </div>
    </TableHead>
  );
}

function DragAlongCell<TData, TValue>({
  cell,
}: {
  cell: Cell<TData, unknown>;
}) {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: "width transform 0.2s ease-in-out",
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (cell.column.columnDef as CustomColumDef<TData, TValue>).visible !==
    false ? (
    <TableCell
      key={cell.id}
      colSpan={
        (cell.column.columnDef as CustomColumDef<TData, TValue>).colSpan ?? 1
      }
      className={clsx(
        (cell.column.columnDef as CustomColumDef<TData, TValue>).cellClassName
      )}
      style={style}
      ref={setNodeRef}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  ) : (
    <></>
  );
}

// reorder columns after drag & drop

export function SortableTable<TData, TValue>({
  table,
  loading,
  placeholder,
  columnOrder,
  setColumnOrderAction,
  onRowClassName,
  onRowClick,
  useHeader,
}: {
  table: TableType<TData>;
  loading: boolean;
  placeholder: ReactNode;
  columnOrder: string[];
  setColumnOrderAction: Dispatch<SetStateAction<string[]>>;
  onRowClassName?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  useHeader: boolean;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrderAction((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        return arrayMove(columnOrder, oldIndex, newIndex); //this is just a splice util
      });
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <BasicTable
        table={table}
        loading={loading}
        placeholder={placeholder}
        useHeader={useHeader}
        headGroupRenderAction={(headerGroup) => (
          <TableRow key={headerGroup.id}>
            <SortableContext
              items={columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              {headerGroup.headers.map((header) => (
                <DraggableTableHeader key={header.id} header={header} />
              ))}
            </SortableContext>
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
            {row.getVisibleCells().map((cell) => (
              <SortableContext
                key={cell.id}
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
              >
                <DragAlongCell key={cell.id} cell={cell} />
              </SortableContext>
            ))}
          </TableRow>
        )}
      />
    </DndContext>
  );
}
