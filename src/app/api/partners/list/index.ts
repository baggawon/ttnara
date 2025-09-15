import type { partner } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface PublicPartnersResponse {
  id: number;
  name: string;
  url: string;
  public_banner_image_url: string;
}

export const GET = async () => {
  let cache = appCache.getByKey(CacheKey.Partners) as partner[] | undefined;
  if (!cache) {
    console.log("Initializing partners cache from DB...");
    await appCache.initializeFromDB();
    cache = appCache.getByKey(CacheKey.Partners) as partner[];
  }

  return { result: true, data: cache };
};
