"use client";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { displaySettingsGet } from "@/helpers/get";
import { QueryKey } from "@/helpers/types";
import type { UserDisplaySettings } from "@/app/api/settings/display";

/**
 * Returns the admin-controlled user display toggles (trade rank / board rank
 * visibility). While the settings query is loading we assume visible to avoid
 * a flash of hidden UI on the happy path.
 */
export const useDisplaySettings = (): {
  showTradeRank: boolean;
  showBoardRank: boolean;
} => {
  const { data } = useGetQuery<UserDisplaySettings, undefined>(
    {
      queryKey: [QueryKey.displaySettings],
      staleTime: Infinity,
    },
    displaySettingsGet,
    undefined,
    { silent: true }
  );
  return {
    showTradeRank: data?.show_trade_rank ?? true,
    showBoardRank: data?.show_board_rank ?? true,
  };
};
