import {
  appCache,
  CacheKey,
  type SupportCachePayload,
} from "@/helpers/server/serverCache";

export type SupportPublicReadResponse = SupportCachePayload;

const EMPTY_PAYLOAD: SupportCachePayload = {
  linkCards: [],
  categoriesWithQnas: [],
};

export const GET = async () => {
  try {
    let payload = appCache.getByKey(CacheKey.Support) as
      | SupportCachePayload
      | undefined;

    if (!payload) {
      await appCache.refreshCache(CacheKey.Support);
      payload = appCache.getByKey(CacheKey.Support) as
        | SupportCachePayload
        | undefined;
    }

    return {
      result: true,
      isSuccess: true,
      data: payload ?? EMPTY_PAYLOAD,
    };
  } catch (error) {
    console.log("support read error", error);
    return {
      result: false,
      isSuccess: false,
      message: String(error),
      data: EMPTY_PAYLOAD,
    };
  }
};
