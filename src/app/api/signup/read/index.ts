import type { user_setting } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface UserSettings {
  min_displayname_length: number;
  max_displayname_length: number;
}

export const GET = async () => {
  if (!appCache.getByKey(CacheKey.UserSettings)) {
    console.log("Initializing cache from DB...");
    await appCache.initializeFromDB();
  }
  const cache = appCache.getByKey(CacheKey.UserSettings) as user_setting;
  const json: UserSettings = {
    min_displayname_length: cache.min_displayname_length,
    max_displayname_length: cache.max_displayname_length,
  };
  return { result: true, data: json };
};
