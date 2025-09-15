import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SearchIcon,
  SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";

export const TableOptionSkeleton = () => (
  <button className="items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 hidden h-10 lg:flex">
    <SlidersHorizontal className="h-4 w-4" />
  </button>
);

export const TableSkeleton = ({
  hideTop,
  hideBottom,
  children,
}: {
  hideTop?: boolean;
  hideBottom?: boolean;
  children?: ReactNode;
}) => (
  <div className="w-full">
    {!hideTop && (
      <div className="flex flex-col md:flex-row items-center my-2 gap-4">
        <div className="relative w-full md:min-w-[328px]">
          <Input className="w-full" placeholder="검색어를 입력하세요." />
          <SearchIcon
            width={20}
            height={20}
            className="absolute top-1/2 right-4 -translate-y-1/2"
          />
        </div>
        <div className="flex gap-2 w-full items-center justify-end">
          {children && children}
        </div>
      </div>
    )}
    <div className="w-full rounded-md border">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-4 my-2 w-full" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <Skeleton className="h-4 my-2 w-full" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Skeleton className="h-4 my-2 w-full" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Skeleton className="h-4 my-2 w-full" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Skeleton className="h-4 my-2 w-full" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Skeleton className="h-4 my-2 w-full" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
    {!hideBottom && (
      <div className="flex items-center justify-between px-2 mt-2">
        <div className="text-sm text-muted-foreground">
          전체 ? 중&nbsp;? 열 선택.
        </div>
        <div className="flex flex-1 justify-between items-center space-x-6 lg:space-x-8">
          <div className="w-full flex gap-2 justify-center">
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              <Input
                className="!w-[2.1rem]"
                min="1"
                max="1"
                type="text"
                defaultValue="?"
              />
              / ?
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                className="hidden h-8 w-8 !p-0 lg:flex"
              >
                <span className="sr-only">시작으로</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" className="h-8 w-8 !p-0">
                <span className="sr-only">이전으로</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" className="h-8 w-8 !p-0">
                <span className="sr-only">다음으로</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="hidden h-8 w-8 !p-0 lg:flex"
              >
                <span className="sr-only">끝으로</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium whitespace-nowrap">표시 개수</p>
            <button
              type="button"
              className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 h-8 w-[70px]"
            >
              <span>?</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
