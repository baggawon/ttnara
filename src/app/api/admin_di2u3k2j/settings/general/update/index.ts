import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { Prisma, general_setting } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface generalUpdateProps extends Partial<general_setting> {
  id: number;
}

// Whitelist of columns admins may update via this endpoint. Anything not listed
// here is silently ignored — prevents form regressions or stray client payloads
// from clobbering server-managed fields (id, blacklisted_users, etc.) or
// reintroducing removed UI toggles.
const ALLOWED_FIELDS = [
  "site_name",
  "site_title",
  "site_description",
  "site_keywords",
  "logo_image_url",
  "favicon_url",
  "apple_icon_url",
  "hero_image_url",
  "hero_action_url",
  "allow_user_registration",
  "p2p_paused",
  "show_seo",
  "show_price_calc",
  "show_price_ticker",
  "show_profile_widget",
] as const satisfies readonly (keyof general_setting)[];

const pickAllowed = (
  json: generalUpdateProps
): Prisma.general_settingUpdateInput => {
  const data: Prisma.general_settingUpdateInput = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in json) {
      // The narrow indexed-access type is preserved by the const tuple.
      (data as Record<string, unknown>)[key] = json[key];
    }
  }
  return data;
};

export const POST = async (json: generalUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || json?.id === 0) throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const data = pickAllowed(json);

    // The settings row is a singleton, but no DB constraint enforces that and a
    // historic check-then-create race may have left duplicate rows. Always write
    // the canonical (lowest-id) row so the write hits the same row every reader
    // returns (all reads use `orderBy: { id: "asc" }`); otherwise an unordered
    // findFirst() could return a different row after the update and the admin UI
    // would appear to "revert" the saved value.
    const canonical = await handleConnect((prisma) =>
      prisma.general_setting.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      })
    );
    if (!canonical) throw ToastData.unknown;

    const updateResult = await handleConnect((prisma) =>
      prisma.general_setting.update({
        where: {
          id: canonical.id,
        },
        data,
      })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.GeneralSettings);
    return {
      result: true,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
