import "server-only";
import { cache } from "react";
import { handleConnect } from "@/helpers/server/prisma";

export interface DisplaySettings {
  showTradeRank: boolean;
  showBoardRank: boolean;
}

// Single cached read of the user display toggles on `user_setting`, resolved
// server-side so the nav/my-page widgets render with the right visibility on
// first paint (a client fetch would flash hidden widgets until it resolves).
// Consumers share one DB hit per request via React `cache()`. Skipping
// `appCache` deliberately so admin saves are reflected on the very next
// request — see `homeVisibility.ts` for the same reasoning.
export const getDisplaySettings = cache(async (): Promise<DisplaySettings> => {
  const row = await handleConnect((prisma) =>
    prisma.user_setting.findFirst({
      orderBy: { id: "asc" },
      select: {
        show_trade_rank: true,
        show_board_rank: true,
      },
    })
  );
  return {
    showTradeRank: row?.show_trade_rank ?? true,
    showBoardRank: row?.show_board_rank ?? true,
  };
});
