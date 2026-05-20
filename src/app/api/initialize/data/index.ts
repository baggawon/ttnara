import type { general_setting } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { initLeaderboardScheduler } from "@/helpers/server/leaderboardScheduler";

export interface SiteSettings {
  allow_user_registration: boolean;
}

export const GET = async () => {
  if (!appCache.getByKey(CacheKey.GeneralSettings)) {
    console.log("Initializing cache from DB...");
    await appCache.initializeFromDB();
    initLeaderboardScheduler();
  }
  const cache = appCache.getByKey(CacheKey.GeneralSettings) as general_setting;
  const json: SiteSettings = {
    allow_user_registration: cache.allow_user_registration,
  };
  return { result: true, data: json };
};
