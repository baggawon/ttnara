import { getNavMenu } from "@/helpers/server/navMenuRead";
import { getHomeVisibility } from "@/helpers/server/homeVisibility";
import { getDisplaySettings } from "@/helpers/server/displaySettings";
import { TopNavigation } from "@/components/3_organisms/TopNavigation";

export const TopNavigationServer = async () => {
  const [menuItems, { showPriceTicker }, { showTradeRank, showBoardRank }] =
    await Promise.all([
      getNavMenu("top"),
      getHomeVisibility(),
      getDisplaySettings(),
    ]);
  return (
    <TopNavigation
      menuItems={menuItems}
      showPriceTicker={showPriceTicker}
      showTradeRank={showTradeRank}
      showBoardRank={showBoardRank}
    />
  );
};
