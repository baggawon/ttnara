import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const KST = "Asia/Seoul";

/** Today's calendar date in Asia/Seoul as "YYYY-MM-DD". */
export const kstToday = (): string => dayjs().tz(KST).format("YYYY-MM-DD");

/** Yesterday's calendar date in Asia/Seoul as "YYYY-MM-DD". */
export const kstYesterday = (): string =>
  dayjs().tz(KST).subtract(1, "day").format("YYYY-MM-DD");

/** Current calendar month in Asia/Seoul as "YYYY-MM". */
export const kstCurrentMonth = (): string => dayjs().tz(KST).format("YYYY-MM");

/**
 * Inclusive first/last calendar date strings for a "YYYY-MM" month.
 * Because attendance_record.kst_date is stored as a "YYYY-MM-DD" string,
 * callers can range-query with plain string comparisons (>= start && <= end).
 */
export const kstMonthRange = (ym: string): { start: string; end: string } => {
  const base = dayjs.tz(`${ym}-01`, KST);
  const valid = base.isValid() ? base : dayjs().tz(KST).startOf("month");
  return {
    start: valid.startOf("month").format("YYYY-MM-DD"),
    end: valid.endOf("month").format("YYYY-MM-DD"),
  };
};
