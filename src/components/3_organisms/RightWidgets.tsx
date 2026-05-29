"use client";

import { PartnerBanners } from "@/components/1_atoms/PartnerBanners";
import PriceWidget from "@/components/1_atoms/PriceWidget";
import CalculatorWidget, {
  type CalculatorWidgetRef,
} from "@/components/2_molecules/CalculatorWidget";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { usePathname } from "next/navigation";
import { useRef } from "react";

interface RightWidgetsProps {
  showPriceCalc?: boolean;
  showPriceTicker?: boolean;
}

export const RightWidgets = ({
  showPriceCalc = true,
  showPriceTicker = true,
}: RightWidgetsProps = {}) => {
  const calculatorRef = useRef<CalculatorWidgetRef | null>(null);
  const pathname = usePathname();

  useEffectFunctionHook({
    Function: () => {
      const mobileBanners = window.document.querySelector("#mobile-banners");
      if (mobileBanners) {
        if (pathname === "/") {
          mobileBanners.classList.add("!hidden");
        } else {
          mobileBanners.classList.remove("!hidden");
        }
      }
    },
    dependency: [pathname],
  });
  return (
    <section className="min-w-[240px] max-w-[240px] h-fit hidden flex-col xl:flex gap-3 sticky top-4 mt-4">
      {showPriceCalc && <CalculatorWidget calculatorRef={calculatorRef} />}
      {showPriceTicker && <PriceWidget calculatorRef={calculatorRef} />}
      <PartnerBanners variant="sidebar" />
    </section>
  );
};
