import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { appCache, CacheKey } from "./serverCache";
import { broadcastLeaderboardUpdate } from "./leaderboardService";

dayjs.extend(utc);
dayjs.extend(timezone);

const KST = "Asia/Seoul";

let initialized = false;

export function initLeaderboardScheduler() {
  if (initialized) return;
  initialized = true;

  scheduleNextDailyReset();
  scheduleNextWeeklyReset();
  console.log("[Leaderboard] Scheduler initialized");
}

function scheduleNextDailyReset() {
  const now = dayjs().tz(KST);
  const nextMidnight = now.add(1, "day").startOf("day");
  const ms = nextMidnight.diff(now);

  setTimeout(async () => {
    console.log("[Leaderboard] Daily reset triggered");
    await appCache.refreshCache(CacheKey.LeaderboardDaily);
    broadcastLeaderboardUpdate();
    scheduleNextDailyReset();
  }, ms);

  console.log(
    `[Leaderboard] Next daily reset in ${Math.round(ms / 1000 / 60)} minutes`
  );
}

function scheduleNextWeeklyReset() {
  const now = dayjs().tz(KST);
  // Next Monday at midnight KST
  const daysUntilMonday = (8 - now.day()) % 7 || 7;
  const nextMonday = now.add(daysUntilMonday, "day").startOf("day");
  const ms = nextMonday.diff(now);

  setTimeout(async () => {
    console.log("[Leaderboard] Weekly reset triggered");
    await appCache.refreshCache(CacheKey.LeaderboardWeekly);
    broadcastLeaderboardUpdate();
    scheduleNextWeeklyReset();
  }, ms);

  console.log(
    `[Leaderboard] Next weekly reset in ${Math.round(ms / 1000 / 60 / 60)} hours`
  );
}
