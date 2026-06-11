import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { ToastData } from "@/helpers/toastData";
import type { user_setting } from "@prisma/client";

export interface UserDisplaySettings {
  show_trade_rank: boolean;
  show_board_rank: boolean;
}

export const GET = async () => {
  try {
    const settings = appCache.getByKey(CacheKey.UserSettings) as
      | user_setting
      | undefined;
    if (!settings) throw ToastData.unknown;

    // Coerce with ?? so a cached row from before the columns existed
    // (e.g. server not restarted after `prisma db push`) defaults to visible.
    const data: UserDisplaySettings = {
      show_trade_rank: settings.show_trade_rank ?? true,
      show_board_rank: settings.show_board_rank ?? true,
    };

    return { result: true, data };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
