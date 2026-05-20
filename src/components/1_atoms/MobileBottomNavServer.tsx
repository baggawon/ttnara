import { getNavMenu } from "@/helpers/server/navMenuRead";
import { MobileBottomNav } from "@/components/1_atoms/MobileBottomNav";

export const MobileBottomNavServer = async () => {
  const menuItems = await getNavMenu("mobile_bottom");
  return <MobileBottomNav menuItems={menuItems} />;
};
