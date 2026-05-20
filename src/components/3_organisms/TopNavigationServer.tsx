import { getNavMenu } from "@/helpers/server/navMenuRead";
import { TopNavigation } from "@/components/3_organisms/TopNavigation";

export const TopNavigationServer = async () => {
  const menuItems = await getNavMenu("top");
  return <TopNavigation menuItems={menuItems} />;
};
