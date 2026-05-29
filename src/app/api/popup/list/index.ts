import { appCache, CacheKey } from "@/helpers/server/serverCache";
import {
  signCloudFrontUrlsInHtml,
  signStoredCloudFrontUrl,
} from "@/helpers/server/s3";
import type { popup } from "@prisma/client";

// Stored popup rows hold unsigned CloudFront URLs (both the image field and any
// images embedded in the HTML content). Sign them at the response boundary —
// never in the cache, since signatures expire well before the long-lived
// popup cache is refreshed.
const signPopup = (p: popup): popup => ({
  ...p,
  image_cloud_front_url: p.image_cloud_front_url
    ? signStoredCloudFrontUrl(p.image_cloud_front_url)
    : p.image_cloud_front_url,
  content: p.content ? signCloudFrontUrlsInHtml(p.content) : p.content,
});

export const GET = async () => {
  try {
    // 캐시에서 팝업 데이터 먼저 확인
    let popups = appCache.getByKey(CacheKey.Popups) as popup[] | undefined;

    // 캐시에 데이터가 없으면 데이터베이스에서 가져오기. An empty array is a
    // valid cached value (no active popups) — only a missing key (undefined)
    // should trigger a refresh, otherwise the read path can never recover from
    // a stale empty cache.
    if (popups === undefined) {
      await appCache.refreshCache(CacheKey.Popups);
      popups = appCache.getByKey(CacheKey.Popups) as popup[] | undefined;
    }

    // The cache holds all active popups; evaluate the start/end window here so
    // popups appear and expire at their scheduled times without waiting for the
    // next cache refresh.
    const now = new Date();
    const visible = (popups ?? []).filter(
      (p) => p.start_date <= now && p.end_date >= now
    );

    return {
      result: true,
      isSuccess: true,
      data: { popups: visible.map(signPopup) },
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: "팝업 목록 조회 중 오류가 발생했습니다.",
      message: String(error),
      data: { popups: [] },
    };
  }
};
