import { now } from "@/helpers/basic";

export const DAYS = 30;

const KST = "Asia/Seoul";

export interface DayBucket {
  date: string;
}

export function buildLast30DayBuckets(): {
  buckets: DayBucket[];
  indexFor: (d: Date) => number;
  windowStart: Date;
} {
  const buckets: DayBucket[] = [];
  const start = now()
    .subtract(DAYS - 1, "day")
    .startOf("day");
  for (let i = 0; i < DAYS; i += 1) {
    buckets.push({ date: start.add(i, "day").format("MM-DD") });
  }
  const windowStart = start.toDate();
  const startMs = start.valueOf();
  const dayMs = 24 * 60 * 60 * 1000;

  const indexFor = (d: Date): number => {
    // Convert to KST day index. dayjs.tz handles the offset; here we use the
    // raw UTC ms because all buckets share the same start-of-day in KST and
    // each bucket is exactly 24h. Dates outside the window return -1.
    const kstMs = new Date(d).getTime();
    const diff = kstMs - startMs;
    if (diff < 0) return -1;
    const idx = Math.floor(diff / dayMs);
    return idx >= DAYS ? -1 : idx;
  };

  return { buckets, indexFor, windowStart };
}

export { KST };
