import "server-only";
import { cache } from "react";
import { handleConnect } from "@/helpers/server/prisma";

export interface HomeVisibility {
  showSeo: boolean;
  showPriceCalc: boolean;
  showPriceTicker: boolean;
  showProfileWidget: boolean;
}

// Single cached read of the home-level visibility toggles on `general_setting`.
// Consumers (server components, layout, TopNavigationServer) all share one DB
// hit per request via React `cache()`. Skipping `appCache` deliberately so
// admin saves are reflected on the very next request — see `brandSettings.ts`
// for the same reasoning.
export const getHomeVisibility = cache(async (): Promise<HomeVisibility> => {
  const row = await handleConnect((prisma) =>
    prisma.general_setting.findFirst({
      orderBy: { id: "asc" },
      select: {
        show_seo: true,
        show_price_calc: true,
        show_price_ticker: true,
        show_profile_widget: true,
      },
    })
  );
  return {
    showSeo: row?.show_seo ?? false,
    showPriceCalc: row?.show_price_calc ?? true,
    showPriceTicker: row?.show_price_ticker ?? true,
    showProfileWidget: row?.show_profile_widget ?? true,
  };
});

export const isSeoVisible = async (): Promise<boolean> =>
  (await getHomeVisibility()).showSeo;
