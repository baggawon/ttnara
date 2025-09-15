import type { Dayjs } from "dayjs";

export const getLastDayjs = (date: Dayjs) =>
  date
    .set("date", date.daysInMonth())
    .set("hour", 23)
    .set("minute", 59)
    .set("second", 59)
    .set("millisecond", 999);

export const getFirstDayjs = (date: Dayjs) =>
  date
    .set("date", 1)
    .set("hour", 0)
    .set("minute", 0)
    .set("second", 0)
    .set("millisecond", 0);

export const getTodayOclock = (date: Dayjs) =>
  date.set("hour", 0).set("minute", 0).set("second", 0).set("millisecond", 0);

export const getTodayEnd = (date: Dayjs) =>
  date
    .set("hour", 23)
    .set("minute", 59)
    .set("second", 59)
    .set("millisecond", 999);

export const getUtcISOString = (date: Dayjs) =>
  date.utc().format("YYYY-MM-DD HH:mm:ss.SSS");
