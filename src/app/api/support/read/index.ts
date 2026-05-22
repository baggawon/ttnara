import {
  appCache,
  CacheKey,
  type SupportCachePayload,
} from "@/helpers/server/serverCache";
import {
  signCloudFrontUrlsInHtml,
  signStoredCloudFrontUrl,
} from "@/helpers/server/s3";

export type SupportPublicReadResponse = SupportCachePayload;

const EMPTY_PAYLOAD: SupportCachePayload = {
  linkCards: [],
  categoriesWithQnas: [],
};

// The support cache stores unsigned URLs (link-card icons and any images
// embedded in QnA answer HTML). Sign them at the response boundary — never in
// the cache, since signatures expire before the long-lived cache is refreshed.
const signPayload = (payload: SupportCachePayload): SupportCachePayload => ({
  linkCards: payload.linkCards.map((card) => ({
    ...card,
    cloudfront_url: card.cloudfront_url
      ? signStoredCloudFrontUrl(card.cloudfront_url)
      : card.cloudfront_url,
  })),
  categoriesWithQnas: payload.categoriesWithQnas.map((category) => ({
    ...category,
    qnas: category.qnas.map((qna) => ({
      ...qna,
      answer: qna.answer ? signCloudFrontUrlsInHtml(qna.answer) : qna.answer,
    })),
  })),
});

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
      data: payload ? signPayload(payload) : EMPTY_PAYLOAD,
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
