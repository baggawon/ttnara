import type { general_setting } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface SiteSettings {
  maintenance_mode: boolean;
  allow_user_registration: boolean;
  allow_login: boolean;
}

export const GET = async () => {
  if (!appCache.getByKey(CacheKey.GeneralSettings)) {
    console.log("Initializing cache from DB...");
    await appCache.initializeFromDB();
  }
  const cache = appCache.getByKey(CacheKey.GeneralSettings) as general_setting;
  const json: SiteSettings = {
    maintenance_mode: cache.maintenance_mode,
    allow_user_registration: cache.allow_user_registration,
    allow_login: cache.allow_login,
  };
  return { result: true, data: json };
};
