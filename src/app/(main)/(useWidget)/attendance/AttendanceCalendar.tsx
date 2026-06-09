"use client";

import { Calendar } from "@/components/ui/calendar";

/** Parse a "YYYY-MM" string to the first day of that month in local time. */
const monthToDate = (ym: string): Date => {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return new Date();
  return new Date(y, m - 1, 1);
};

/** Parse a "YYYY-MM-DD" string to a local-midnight Date (matches calendar cells). */
const dateStrToDate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Format a Date back to "YYYY-MM" without UTC drift. */
const dateToMonth = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export default function AttendanceCalendar({
  month,
  checkedDates,
  onMonthChange,
}: {
  month: string;
  checkedDates: string[];
  onMonthChange: (ym: string) => void;
}) {
  const checked = checkedDates.map(dateStrToDate);

  return (
    <Calendar
      mode="default"
      month={monthToDate(month)}
      onMonthChange={(d) => onMonthChange(dateToMonth(d))}
      modifiers={{ checked }}
      modifiersClassNames={{
        checked:
          "bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary hover:text-primary-foreground",
      }}
      className="w-full"
      // Stretch the grid to fill the pane: rows/cells flex to distribute the
      // 7 columns evenly while each day stays a centered fixed-size circle so
      // the "checked" highlight remains round.
      classNames={{
        months: "w-full",
        month: "w-full space-y-4",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell:
          "flex-1 text-muted-foreground rounded-md font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "flex-1 h-9 text-center text-sm p-0 relative",
        day: "h-9 w-9 mx-auto p-0 font-normal rounded-md inline-flex items-center justify-center hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100",
      }}
    />
  );
}
