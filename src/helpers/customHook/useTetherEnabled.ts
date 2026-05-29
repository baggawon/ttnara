"use client";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { tetherSettingsGet } from "@/helpers/get";
import { QueryKey } from "@/helpers/types";
import type { TetherPublicSettings } from "@/app/api/tether/settings/read";

/**
 * Returns whether the tether (P2P trade) feature is currently enabled.
 * While the settings query is loading we assume enabled to avoid a flash
 * of hidden UI on the happy path. The server-side guard is the source of
 * truth for redirects.
 */
export const useTetherEnabled = (): boolean => {
  const { data } = useGetQuery<TetherPublicSettings, undefined>(
    {
      queryKey: [QueryKey.tetherSettings],
      staleTime: Infinity,
    },
    tetherSettingsGet,
    undefined,
    { silent: true }
  );
  return data ? data.use_tether_board : true;
};
