import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface TopicCategoriesBulkCreateProps {
  topic_id: number;
  names: string[];
}

export interface TopicCategoriesBulkCreateResult {
  created: string[];
  skipped: string[];
}

export const POST = async (json: TopicCategoriesBulkCreateProps) => {
  try {
    if (
      typeof json?.topic_id !== "number" ||
      !Array.isArray(json?.names) ||
      json.names.length === 0
    ) {
      throw ToastData.unknown;
    }

    await requestValidator([RequestValidator.Admin], json);

    // Sanitize and dedupe the incoming list. Names ride the same VarChar(100)
    // limit as the underlying column.
    const seen = new Set<string>();
    const cleaned = json.names
      .map((n) => (typeof n === "string" ? n.trim() : ""))
      .filter((n) => n.length > 0 && n.length <= 100)
      .filter((n) => {
        if (seen.has(n)) return false;
        seen.add(n);
        return true;
      });

    if (cleaned.length === 0) {
      return {
        result: true,
        data: { created: [], skipped: [] } as TopicCategoriesBulkCreateResult,
      };
    }

    // Pre-skip any names that already exist on this topic so we don't trip
    // the unique constraint mid-loop. Anything beyond that gets a sequential
    // display_order starting after the current max, so the new ones land at
    // the end of the existing ordering instead of all colliding at 1.
    const existing = await handleConnect((prisma) =>
      prisma.category.findMany({
        where: { topic_id: json.topic_id, name: { in: cleaned } },
        select: { name: true },
      })
    );
    const existingNames = new Set((existing ?? []).map((c) => c.name));
    const toCreate = cleaned.filter((n) => !existingNames.has(n));

    if (toCreate.length === 0) {
      return {
        result: true,
        data: {
          created: [],
          skipped: cleaned,
        } as TopicCategoriesBulkCreateResult,
      };
    }

    const maxOrderRow = await handleConnect((prisma) =>
      prisma.category.aggregate({
        where: { topic_id: json.topic_id },
        _max: { display_order: true },
      })
    );
    const baseOrder = (maxOrderRow?._max.display_order ?? 0) + 1;

    const result = await handleConnect((prisma) =>
      prisma.category.createMany({
        data: toCreate.map((name, idx) => ({
          name,
          topic_id: json.topic_id,
          display_order: baseOrder + idx,
          is_active: true,
        })),
        skipDuplicates: true,
      })
    );
    if (!result) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.Topics);

    return {
      result: true,
      data: {
        created: toCreate,
        skipped: cleaned.filter((n) => existingNames.has(n)),
      } as TopicCategoriesBulkCreateResult,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
