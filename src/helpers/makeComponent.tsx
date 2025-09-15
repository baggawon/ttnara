import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { DataTableColumnHeader } from "@/components/2_molecules/Table/TableHeader";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getColumnHeaderTitle,
  getConvertValue,
  stringView,
} from "@/helpers/common";
import { map } from "@/helpers/basic";

export const makeSelectorCheckbox = (id: string): CustomColumDef<any> => ({
  id,
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value: boolean) =>
        table.toggleAllPageRowsSelected(!!value)
      }
      aria-label="Select all"
      className="translate-y-[2px]"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
      aria-label="Select row"
      className="translate-y-[2px]"
    />
  ),
  useRowSelect: true,
  enableSorting: false,
  enableHiding: false,
});

export const makeDefaultHeaderRender = function <T>(): Partial<
  CustomColumDef<T>
> {
  return {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={getColumnHeaderTitle(column)}
      />
    ),
  };
};

export const makeDefaultCellRender = function <T>(): Partial<
  CustomColumDef<T>
> {
  return {
    cell: ({ getValue }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate font-normal">
          {stringView(getValue())}
        </span>
      </div>
    ),
  };
};

export const makeConvertCellRender = function <T>(): Partial<
  CustomColumDef<T>
> {
  return {
    cell: (props) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate font-normal">
          {getConvertValue(props)}
        </span>
      </div>
    ),
  };
};

export const makeDefaultRender = function <T>(): Partial<CustomColumDef<T>> {
  return {
    ...makeDefaultHeaderRender(),
    ...makeDefaultCellRender(),
  };
};

export const makeConvertRender = function <T>(): Partial<CustomColumDef<T>> {
  return {
    ...makeDefaultHeaderRender(),
    ...makeConvertCellRender(),
  };
};

export const setDefaultColumn = function <T>(
  columns: CustomColumDef<T>[]
): CustomColumDef<T>[] {
  return map(columns, (column) => {
    return {
      ...column,
      ...(!column.header && makeDefaultHeaderRender()),
      ...(!column.cell && !column.convertValue && makeDefaultCellRender()),
      ...(column.convertValue && makeConvertCellRender()),
    };
  });
};
