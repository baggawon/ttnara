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
    <section className="min-w-[308px] max-w-[308px] h-fit hidden flex-col md:flex gap-4 sticky top-4">
      <CalculatorWidget calculatorRef={calculatorRef} />
      <PriceWidget calculatorRef={calculatorRef} />

      <PartnerBanners position="right" displayMode="pc" />
    </section>
  );
};
