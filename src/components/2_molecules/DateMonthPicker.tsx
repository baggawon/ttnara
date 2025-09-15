"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "../../../node_modules/lucide-react";

import { cn } from "@/components/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);
import "dayjs/locale/ko";
import { map } from "@/helpers/basic";
import clsx from "clsx";
import { getFirstDayjs, getLastDayjs } from "@/helpers/date";

export interface DateMonthPickerProps {
  from: Date;
  to: Date;
}

export function DateMonthPicker({
  className,
  onChange,
}: {
  className?: string;
  onChange?: (date: DateMonthPickerProps | undefined) => void;
}) {
  const [date, setDate] = React.useState<DateMonthPickerProps | undefined>({
    from: getFirstDayjs(dayjs.utc()).subtract(12, "month").toDate(),
    to: getLastDayjs(dayjs.utc()).toDate(),
  });

  const lastMonth = getFirstDayjs(dayjs.utc());

  const firstMonth = lastMonth.subtract(5, "year");

  onChange?.(date);

  const isGteLte = (target: Dayjs, first?: Dayjs, last?: Dayjs) =>
    first &&
    last &&
    (target.isSame(dayjs.utc(first)) ||
      target.isSame(dayjs.utc(last)) ||
      (target.isAfter(dayjs.utc(first)) && target.isBefore(dayjs.utc(last))));

  const [year, setYear] = React.useState<number>(dayjs.utc().year());
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            aria-controls="date"
            variant={"outline"}
            size="sm"
            className={cn(
              "w-fit justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {dayjs.utc(date.from).locale("ko").format("YYYY, MMM")}
                  {!getFirstDayjs(dayjs.utc(date.from)).isSame(
                    getFirstDayjs(dayjs.utc(date.to))
                  ) && (
                    <>
                      -&nbsp;
                      {dayjs.utc(date.to).locale("ko").format("YYYY, MMM")}
                    </>
                  )}
                </>
              ) : (
                dayjs.utc(date.from).locale("ko").format("YYYY, MMM")
              )
            ) : (
              <span>날짜 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-[28px]" align="end">
          <div className="w-full flex justify-between pt-1 relative items-center">
            <Button
              type="button"
              variant="outline"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent opacity-50 hover:opacity-100 !p-0"
              onClick={() => setYear(year - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">{year}</div>
            <Button
              type="button"
              variant="outline"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent opacity-50 hover:opacity-100 !p-0"
              onClick={() => setYear(year + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative mt-6 grid grid-cols-4 gap-y-2">
            {map(12, (index) => {
              const currentDate = getFirstDayjs(
                dayjs.utc().set("year", year).set("month", index)
              );

              const lastDate = getLastDayjs(currentDate);

              const isBetween =
                date &&
                isGteLte(currentDate, dayjs.utc(date.from), dayjs.utc(date.to));
              return (
                <div key={`month_${index}_${year}}`} className="relative">
                  <Button
                    type="button"
                    variant={
                      date &&
                      (currentDate.isSame(dayjs.utc(date.from)) ||
                        lastDate.isSame(dayjs.utc(date.to)))
                        ? "default"
                        : "ghost"
                    }
                    className="relative z-[2] !p-0 w-full"
                    disabled={!isGteLte(currentDate, firstMonth, lastMonth)}
                    onClick={() => {
                      const convertDate = date
                        ? { ...date }
                        : {
                            from: currentDate.toDate(),
                            to: lastDate.toDate(),
                          };
                      if (
                        date &&
                        (dayjs.utc(date.from).isSame(currentDate) ||
                          (date.to && dayjs.utc(date.to).isSame(currentDate)))
                      ) {
                        onChange?.(undefined);
                        return setDate(undefined);
                      } else if (
                        (date && dayjs.utc(date.from).isAfter(currentDate)) ||
                        !date
                      ) {
                        convertDate.from = currentDate.toDate();
                      } else {
                        convertDate.to = lastDate.toDate();
                      }

                      if (
                        convertDate.from &&
                        convertDate.to &&
                        dayjs
                          .duration(
                            dayjs
                              .utc(convertDate.to)
                              .diff(dayjs.utc(convertDate.from))
                          )
                          .asDays() > 366
                      ) {
                        return;
                      }
                      onChange?.(convertDate);
                      setDate(convertDate);
                    }}
                  >
                    {dayjs.utc().set("month", index).locale("ko").format("MMM")}
                  </Button>
                  {isBetween && (
                    <div
                      className={clsx(
                        "absolute top-0 left-0 w-full h-full bg-accent z-[0]",
                        date &&
                          dayjs.utc(date.from).isSame(currentDate) &&
                          "rounded-l-md",
                        date &&
                          dayjs.utc(date.to).isSame(lastDate) &&
                          "rounded-r-md"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
