import { getNavMenu } from "@/helpers/server/navMenuRead";
import { getHomeVisibility } from "@/helpers/server/homeVisibility";
import { TopNavigation } from "@/components/3_organisms/TopNavigation";

export const TopNavigationServer = async () => {
  const [menuItems, { showPriceTicker }] = await Promise.all([
    getNavMenu("top"),
    getHomeVisibility(),
  ]);
  return (
    <TopNavigation menuItems={menuItems} showPriceTicker={showPriceTicker} />
  );
};
