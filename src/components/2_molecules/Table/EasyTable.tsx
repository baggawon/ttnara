import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isArray, map } from "@/helpers/basic";
import { createId } from "@paralleldrive/cuid2";
import type { ReactNode } from "react";
import clsx from "clsx";

interface Span {
  startIndex: boolean;
  remainCount: number;
  isDisplay: boolean;
}
interface Tdoptions {
  colSpan?: Span;
  rowSpan?: Span;
}

export interface EasyTableHeader {
  id: string;
  headerClassName?: string;
  cellClassName?: string;
  label: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  cell?: ({
    value,
    original,
  }: {
    value?: string | number | null;
    original: any;
  }) => ReactNode;
  cellOptions?: (row: any, rowIndex: number, cellIndex: number) => Tdoptions;
}

export const defaultPlaceholder = "데이터가 없습니다.";

const EasyTable = ({
  headers,
  data,
  placeholder = defaultPlaceholder,
  className,
  useBorder = true,
  showHeader = true,
}: {
  headers?: EasyTableHeader[];
  showHeader?: boolean;
  data: any[];
  placeholder?: string;
  className?: string;
  useBorder?: boolean;
}) => {
  return (
    <div className={clsx(useBorder && "rounded-md border")}>
      <Table className={clsx(className)}>
        {isArray(headers, ">", 0) && showHeader && (
          <TableHeader>
            <TableRow>
              {headers.map(({ label, colSpan, rowSpan, headerClassName }) => (
                <TableHead
                  key={`header_${label}`}
                  colSpan={colSpan}
                  rowSpan={rowSpan}
                  className={clsx(headerClassName)}
                >
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {!data && (
            <TableRow>
              <TableCell
                colSpan={headers?.length}
                className="h-24 text-center"
              ></TableCell>
            </TableRow>
          )}
          {data &&
            isArray(data, ">", 0) &&
            map(data as any[], (row, rowIndex) => {
              const key = createId();
              return (
                <TableRow key={key}>
                  {headers &&
                    map(
                      headers,
                      ({ id, cell, cellOptions, cellClassName }, cellIndex) => {
                        const options = cellOptions
                          ? cellOptions(row, rowIndex, cellIndex)
                          : null;
                        const needHide =
                          (options?.colSpan && !options.colSpan.isDisplay) ||
                          (options?.rowSpan && !options.rowSpan.isDisplay);

                        if (needHide) {
                          return <></>;
                        }

                        return (
                          <TableCell
                            key={`${key}*&*${id}`}
                            colSpan={
                              options?.colSpan?.startIndex
                                ? options?.colSpan?.remainCount
                                : undefined
                            }
                            rowSpan={
                              options?.rowSpan?.startIndex
                                ? options?.rowSpan?.remainCount
                                : undefined
                            }
                            className={clsx(cellClassName)}
                          >
                            {cell
                              ? cell({ value: row[id], original: row })
                              : row[id]}
                          </TableCell>
                        );
                      }
                    )}
                  {!headers &&
                    map(Object.entries(row), ([key, value], cellIndex) => (
                      <TableCell key={`${key}*&*${cellIndex}`}>
                        {value as ReactNode}
                      </TableCell>
                    ))}
                </TableRow>
              );
            })}
          {data && isArray(data, "===", 0) && (
            <TableRow>
              <TableCell colSpan={headers?.length} className="h-24 text-center">
                {placeholder}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EasyTable;
