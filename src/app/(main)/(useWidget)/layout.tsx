import type { ReactNode } from "react";
import { RightWidgets } from "@/components/3_organisms/RightWidgets";
import MainFooterWidget from "@/components/1_atoms/MainFooterWidget";
import { PartnerBanners } from "@/components/1_atoms/PartnerBanners";
import { getHomeVisibility } from "@/helpers/server/homeVisibility";

export default async function Layout(props: { children: ReactNode }) {
  const { showPriceCalc, showPriceTicker, showProfileWidget } =
    await getHomeVisibility();
  return (
    <>
      <div className="flex gap-4 w-full">
        {/* TODO: 미리보기 위젯 */}
        <div className="w-full min-w-0 flex flex-col gap-4 pt-4">
          {props.children}
          <div id="mobile-banners" className="xl:hidden mt-4 mb-20 px-4">
            <PartnerBanners variant="inline" />
          </div>
          <MainFooterWidget />
        </div>
        <RightWidgets
          showPriceCalc={showPriceCalc}
          showPriceTicker={showPriceTicker}
          showProfileWidget={showProfileWidget}
        />
      </div>
    </>
  );
}
