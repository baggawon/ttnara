import NodeCache from "node-cache";
import { handleConnect } from "./prisma";
import { forEach, removeColumnsFromObject } from "../basic";
import { topicDefault } from "../defaultValue";
import { Currency } from "@/helpers/types";

export enum CacheKey {
  GeneralSettings = "generalSettings",
  LevelSettings = "levelSettings",
  UserSettings = "userSettings",
  ThreadGeneralSettings = "threadGeneralSettings",
  Topics = "topics",
  TetherCategories = "tetherCategories",
  Tether = "tether",
  TradeRanks = "tradeRanks",
  Partners = "partners",
}

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
      await Promise.all([
        this.initialize(),
        // 설정 데이터 가져오기
        this.refreshCache(CacheKey.GeneralSettings),
        this.refreshCache(CacheKey.LevelSettings),
        this.refreshCache(CacheKey.UserSettings),
        this.refreshCache(CacheKey.ThreadGeneralSettings),
        this.refreshCache(CacheKey.Topics),
        this.refreshCache(CacheKey.TetherCategories),
        this.refreshCache(CacheKey.Tether),
        this.refreshCache(CacheKey.TradeRanks),
        this.refreshCache(CacheKey.Partners),
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
            prisma.general_setting.findFirst()
          );
          if (generalSettings === null) {
            await handleConnect((prisma) => prisma.general_setting.create({}));
            generalSettings = await handleConnect((prisma) =>
              prisma.general_setting.findFirst()
            );
          }
          this.cache.set("generalSettings", generalSettings);
          break;
        case "levelSettings":
          let levelSettings = await handleConnect((prisma) =>
            prisma.level_setting.findFirst()
          );
          if (levelSettings === null) {
            await handleConnect((prisma) => prisma.level_setting.create({}));
            levelSettings = await handleConnect((prisma) =>
              prisma.level_setting.findFirst()
            );
          }
          this.cache.set("levelSettings", levelSettings);
          break;
        case "userSettings":
          let userSettings = await handleConnect((prisma) =>
            prisma.user_setting.findFirst()
          );
          if (userSettings === null) {
            await handleConnect((prisma) => prisma.user_setting.create({}));
            userSettings = await handleConnect((prisma) =>
              prisma.user_setting.findFirst()
            );
          }
          this.cache.set("userSettings", userSettings);
          break;
        case "threadGeneralSettings":
          let threadGeneralSettings = await handleConnect((prisma) =>
            prisma.thread_setting.findFirst()
          );
          if (threadGeneralSettings === null) {
            await handleConnect((prisma) => prisma.thread_setting.create({}));
            threadGeneralSettings = await handleConnect((prisma) =>
              prisma.thread_setting.findFirst()
            );
          }
          this.cache.set("threadGeneralSettings", threadGeneralSettings);
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
                public_partner_image_url: true,
              },
            })
          );
          this.cache.set("partners", partners ?? []);
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

  public set(key: string, value: any) {
    return this.cache.set(key, value);
  }
}

export const appCache = AppCache.getInstance();
