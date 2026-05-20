import type { partner } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { getSignedCloudFrontUrl } from "@/helpers/server/s3";

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

  const data = cache.map((p) => ({
    ...p,
    public_banner_image_url: p.public_banner_image_url
      ? getSignedCloudFrontUrl(p.public_banner_image_url)
      : "",
  }));

  return { result: true, data };
};
