"use client";

import { PartnerBanners } from "@/components/1_atoms/PartnerBanners";
import PriceWidget from "@/components/1_atoms/PriceWidget";
import CalculatorWidget, {
  type CalculatorWidgetRef,
} from "@/components/2_molecules/CalculatorWidget";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export const RightWidgets = () => {
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
      <CalculatorWidget calculatorRef={calculatorRef} />
      <PriceWidget calculatorRef={calculatorRef} />
      <PartnerBanners variant="sidebar" />
    </section>
  );
};
