import { appCache, CacheKey } from "@/helpers/server/serverCache";

export const GET = async () => {
  try {
    // 캐시에서 팝업 데이터 먼저 확인
    let popups = appCache.getByKey(CacheKey.Popups);

    // 캐시에 데이터가 없으면 데이터베이스에서 가져오기
    if (!popups) {
      await appCache.refreshCache(CacheKey.Popups);
      popups = appCache.getByKey(CacheKey.Popups);
    }

    return {
      result: true,
      isSuccess: true,
      data: { popups: popups || [] },
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
