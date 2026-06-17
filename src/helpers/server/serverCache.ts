import NodeCache from "node-cache";
import { handleConnect } from "./prisma";
import { forEach, removeColumnsFromObject } from "../basic";
import { topicDefault } from "../defaultValue";
import { Currency } from "@/helpers/types";
import {
  fetchLeaderboardFromDB,
  getCurrentPeriodKeys,
  seedTotalLeaderboard,
} from "./leaderboardService";
import { seedNavMenuIfEmpty } from "./navMenuSeed";

export enum CacheKey {
  GeneralSettings = "generalSettings",
  LevelSettings = "levelSettings",
  UserSettings = "userSettings",
  ThreadGeneralSettings = "threadGeneralSettings",
  TetherSettings = "tetherSettings",
  Topics = "topics",
  TetherCategories = "tetherCategories",
  Tether = "tether",
  TradeRanks = "tradeRanks",
  BoardRanks = "boardRanks",
  Partners = "partners",
  Popups = "popups",
  Support = "support",
  LeaderboardTotal = "leaderboardTotal",
  LeaderboardDaily = "leaderboardDaily",
  LeaderboardWeekly = "leaderboardWeekly",
  AttendanceSetting = "attendanceSetting",
}

export interface SupportCacheLinkCard {
  id: number;
  title: string;
  description: string | null;
  url: string;
  cloudfront_url: string | null;
  opens_in_new_tab: boolean;
  display_order: number;
}

export interface SupportCacheQna {
  id: number;
  question: string;
  answer: string;
  content_format: string;
  display_order: number;
}

export interface SupportCacheCategory {
  id: number;
  name: string;
  display_order: number;
  qnas: SupportCacheQna[];
}

export interface SupportCachePayload {
  linkCards: SupportCacheLinkCard[];
  categoriesWithQnas: SupportCacheCategory[];
}

// Self-heal window: if refreshAllLeaderboardCaches() ever fails silently after
// a trade completion, the stale cache expires within this many seconds and the
// next read falls back to the DB.
const LEADERBOARD_CACHE_TTL_SECONDS = 60;

class AppCache {
  private static instance: AppCache;
  public cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({ stdTTL: 0 });
  }

  public static getInstance(): AppCache {
    if (!AppCache.instance) {
      AppCache.instance = new AppCache();
    }
    return AppCache.instance;
  }

  public async initializeFromDB() {
    try {
      // Seed must finish before the nav caches are refreshed, otherwise the
      // cache could be populated from the pre-seed row set (missing the
      // system home/chat_toggle items) and the user-facing nav would diverge
      // from what the admin manager shows.
      await Promise.all([this.initialize(), seedNavMenuIfEmpty()]);

      await Promise.all([
        // 설정 데이터 가져오기
        this.refreshCache(CacheKey.GeneralSettings),
        this.refreshCache(CacheKey.LevelSettings),
        this.refreshCache(CacheKey.UserSettings),
        this.refreshCache(CacheKey.ThreadGeneralSettings),
        this.refreshCache(CacheKey.TetherSettings),
        this.refreshCache(CacheKey.Topics),
        this.refreshCache(CacheKey.TetherCategories),
        this.refreshCache(CacheKey.Tether),
        this.refreshCache(CacheKey.TradeRanks),
        this.refreshCache(CacheKey.BoardRanks),
        this.refreshCache(CacheKey.Partners),
        this.refreshCache(CacheKey.Popups),
        this.refreshCache(CacheKey.Support),
        this.refreshCache(CacheKey.LeaderboardTotal),
        this.refreshCache(CacheKey.LeaderboardDaily),
        this.refreshCache(CacheKey.LeaderboardWeekly),
        this.refreshCache(CacheKey.AttendanceSetting),
      ]);

      return true;
    } catch (error) {
      console.error("Failed to initialize cache from DB:", error);
      return false;
    }
  }

  public async initialize() {
    // 캐시 초기화 작업
    const topic = await handleConnect((prisma) => prisma.topic.findFirst());
    if (!topic) {
      await handleConnect((prisma) =>
        prisma.topic.createMany({
          skipDuplicates: true,
          data: [
            removeColumnsFromObject(
              topicDefault({
                name: "공지사항",
                url: "notice",
                display_order: 1,
              }),
              ["id"]
            ),
            removeColumnsFromObject(
              topicDefault({
                name: "테더뉴스",
                url: "tether_news",
                display_order: 2,
              }),
              ["id"]
            ),
            removeColumnsFromObject(
              topicDefault({
                name: "자유게시판",
                url: "freedom",
                display_order: 3,
              }),
              ["id"]
            ),
            removeColumnsFromObject(
              topicDefault({
                name: "정보공유",
                url: "tips",
                display_order: 4,
              }),
              ["id"]
            ),
            removeColumnsFromObject(
              topicDefault({
                name: "거래신고",
                url: "trade_report",
                display_order: 5,
              }),
              ["id"]
            ),
            removeColumnsFromObject(
              topicDefault({
                name: "이용 가이드",
                url: "guide",
                display_order: 6,
              }),
              ["id"]
            ),
            removeColumnsFromObject(
              topicDefault({
                name: "자유홍보",
                url: "promotion",
                display_order: 7,
              }),
              ["id"]
            ),
            removeColumnsFromObject(
              topicDefault({
                name: "이벤트",
                url: "event",
                display_order: 8,
              }),
              ["id"]
            ),
          ],
        })
      );
    }
  }

  // 캐시 갱신 메서드
  public async refreshCache(key: CacheKey) {
    try {
      switch (key) {
        case "generalSettings":
          let generalSettings = await handleConnect((prisma) =>
            prisma.general_setting.findFirst({ orderBy: { id: "asc" } })
          );
          if (generalSettings === null) {
            await handleConnect((prisma) => prisma.general_setting.create({}));
            generalSettings = await handleConnect((prisma) =>
              prisma.general_setting.findFirst({ orderBy: { id: "asc" } })
            );
          }
          this.cache.set("generalSettings", generalSettings);
          break;
        case "levelSettings":
          let levelSettings = await handleConnect((prisma) =>
            prisma.level_setting.findFirst({ orderBy: { id: "asc" } })
          );
          if (levelSettings === null) {
            await handleConnect((prisma) => prisma.level_setting.create({}));
            levelSettings = await handleConnect((prisma) =>
              prisma.level_setting.findFirst({ orderBy: { id: "asc" } })
            );
          }
          this.cache.set("levelSettings", levelSettings);
          break;
        case "userSettings":
          let userSettings = await handleConnect((prisma) =>
            prisma.user_setting.findFirst({ orderBy: { id: "asc" } })
          );
          if (userSettings === null) {
            await handleConnect((prisma) => prisma.user_setting.create({}));
            userSettings = await handleConnect((prisma) =>
              prisma.user_setting.findFirst({ orderBy: { id: "asc" } })
            );
          }
          this.cache.set("userSettings", userSettings);
          break;
        case "threadGeneralSettings":
          let threadGeneralSettings = await handleConnect((prisma) =>
            prisma.thread_setting.findFirst({ orderBy: { id: "asc" } })
          );
          if (threadGeneralSettings === null) {
            await handleConnect((prisma) => prisma.thread_setting.create({}));
            threadGeneralSettings = await handleConnect((prisma) =>
              prisma.thread_setting.findFirst({ orderBy: { id: "asc" } })
            );
          }
          this.cache.set("threadGeneralSettings", threadGeneralSettings);
          break;
        case "tetherSettings":
          let tetherSettings = await handleConnect((prisma) =>
            prisma.tether_setting.findFirst({ orderBy: { id: "asc" } })
          );
          if (tetherSettings === null) {
            await handleConnect((prisma) => prisma.tether_setting.create({}));
            tetherSettings = await handleConnect((prisma) =>
              prisma.tether_setting.findFirst({ orderBy: { id: "asc" } })
            );
          }
          this.cache.set("tetherSettings", tetherSettings);
          break;
        case "topics":
          const topics: any = {};
          const topicDatas = await handleConnect((prisma) =>
            prisma.topic.findMany({
              include: {
                categories: true,
              },
            })
          );
          if (!topicDatas) break;
          forEach(topicDatas, (topicData) => {
            const categories: any = {};
            forEach(topicData.categories, (category) => {
              categories[category.name] = category;
            });
            topics[topicData.url] = { ...topicData, categories };
          });
          this.cache.set("topics", topics);
          break;
        case "tetherCategories":
          const tetherCategories = await handleConnect((prisma) =>
            prisma.tether_category.findMany()
          );
          this.cache.set("tetherCategories", tetherCategories ?? []);
          break;
        case "tether":
          const tether = await handleConnect((prisma) =>
            prisma.common.findFirst({
              where: {
                key: Currency.테더,
              },
            })
          );
          if (tether) this.cache.set("tether", JSON.parse(tether.value));
          break;
        case "tradeRanks":
          const tradeRanks = await handleConnect((prisma) =>
            prisma.trade_rank.findMany()
          );
          this.cache.set("tradeRanks", tradeRanks ?? []);
          break;
        case "boardRanks":
          const boardRanks = await handleConnect((prisma) =>
            prisma.board_rank.findMany()
          );
          this.cache.set("boardRanks", boardRanks ?? []);
          break;
        case "partners":
          const partners = await handleConnect((prisma) =>
            prisma.partner.findMany({
              where: { is_active: true },
              orderBy: [{ display_order: "asc" }, { created_at: "desc" }],
              select: {
                id: true,
                name: true,
                url: true,
                public_banner_image_url: true,
              },
            })
          );
          this.cache.set("partners", partners ?? []);
          break;
        case "popups":
          // Cache every active popup regardless of its start/end window. The
          // visible window is time-dependent, so it is evaluated per request in
          // the list route — baking it in here would freeze the window at the
          // moment of the last refresh (scheduled popups would never appear and
          // expired ones would linger until the next CRUD or restart).
          const popups = await handleConnect((prisma) =>
            prisma.popup.findMany({
              where: { is_active: true },
              orderBy: [{ display_order: "asc" }, { created_at: "desc" }],
            })
          );
          this.cache.set("popups", popups ?? []);
          break;
        case "support": {
          const [linkCardRows, categoryRows] = (await handleConnect((prisma) =>
            Promise.all([
              prisma.support_link_card.findMany({
                where: { is_active: true },
                orderBy: [{ display_order: "asc" }, { created_at: "desc" }],
                select: {
                  id: true,
                  title: true,
                  description: true,
                  url: true,
                  cloudfront_url: true,
                  opens_in_new_tab: true,
                  display_order: true,
                },
              }),
              prisma.support_qna_category.findMany({
                where: { is_active: true },
                orderBy: [{ display_order: "asc" }, { id: "asc" }],
                select: {
                  id: true,
                  name: true,
                  display_order: true,
                  qnas: {
                    where: { is_active: true },
                    orderBy: [{ display_order: "asc" }, { id: "asc" }],
                    select: {
                      id: true,
                      question: true,
                      answer: true,
                      content_format: true,
                      display_order: true,
                    },
                  },
                },
              }),
            ])
          )) ?? [[], []];

          const payload: SupportCachePayload = {
            linkCards: linkCardRows ?? [],
            categoriesWithQnas: categoryRows ?? [],
          };
          this.cache.set("support", payload);
          break;
        }
        case "leaderboardTotal": {
          const totalEntries = await fetchLeaderboardFromDB("total", "all");
          if (totalEntries.length === 0) {
            await seedTotalLeaderboard();
            const seeded = await fetchLeaderboardFromDB("total", "all");
            this.cache.set(
              "leaderboardTotal",
              seeded,
              LEADERBOARD_CACHE_TTL_SECONDS
            );
          } else {
            this.cache.set(
              "leaderboardTotal",
              totalEntries,
              LEADERBOARD_CACHE_TTL_SECONDS
            );
          }
          break;
        }
        case "leaderboardDaily": {
          const { daily } = getCurrentPeriodKeys();
          const dailyEntries = await fetchLeaderboardFromDB("daily", daily);
          this.cache.set(
            "leaderboardDaily",
            dailyEntries,
            LEADERBOARD_CACHE_TTL_SECONDS
          );
          break;
        }
        case "leaderboardWeekly": {
          const { weekly } = getCurrentPeriodKeys();
          const weeklyEntries = await fetchLeaderboardFromDB("weekly", weekly);
          this.cache.set(
            "leaderboardWeekly",
            weeklyEntries,
            LEADERBOARD_CACHE_TTL_SECONDS
          );
          break;
        }
        case "attendanceSetting":
          let attendanceSetting = await handleConnect((prisma) =>
            prisma.attendance_setting.findFirst({ orderBy: { id: "asc" } })
          );
          if (attendanceSetting === null) {
            await handleConnect((prisma) =>
              prisma.attendance_setting.create({ data: {} })
            );
            attendanceSetting = await handleConnect((prisma) =>
              prisma.attendance_setting.findFirst({ orderBy: { id: "asc" } })
            );
          }
          this.cache.set("attendanceSetting", attendanceSetting);
          break;
      }
    } catch (error) {
      console.error(`Failed to refresh cache for ${key}:`, error);
    }
  }

  // 유틸리티 메서드들
  public getByKey(key: CacheKey) {
    return this.cache.get(key);
  }

  public get(key: string) {
    return this.cache.get(key);
  }

  public set(key: string, value: any, ttlSeconds?: number) {
    return ttlSeconds !== undefined
      ? this.cache.set(key, value, ttlSeconds)
      : this.cache.set(key, value);
  }
}

export const appCache = AppCache.getInstance();

/**
 * Whether a rank system currently has at least one active tier, read from the
 * in-memory cache at zero DB cost.
 *
 * Used as a display safety net: if a surface's chosen rank source points at a
 * system with no tiers (e.g. p2p disabled → 0 trade ranks), serve no badge
 * rather than a stale per-user snapshot. Returns `null` when the cache is not
 * yet populated so callers can skip the guard instead of hiding valid badges.
 */
export function rankSystemHasActiveTiers(
  system: "trade" | "board"
): boolean | null {
  const list = appCache.getByKey(
    system === "trade" ? CacheKey.TradeRanks : CacheKey.BoardRanks
  ) as Array<{ is_active?: boolean }> | undefined;
  if (!Array.isArray(list)) return null;
  return list.some((r) => r?.is_active);
}
