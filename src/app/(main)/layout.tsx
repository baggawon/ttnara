import type { ReactNode } from "react";
import { TopNavigation } from "@/components/3_organisms/TopNavigation";
import MainFooterWidget from "@/components/1_atoms/MainFooterWidget";
import { MobileBottomNav } from "@/components/1_atoms/MobileBottomNav";
import { getDehydratedQueries } from "@/helpers/query";
import { QueryKey } from "@/helpers/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { HydrationBoundary } from "@tanstack/react-query";
import { PartnerBanners } from "@/components/1_atoms/PartnerBanners";
import { PopupDisplay } from "@/components/3_organisms/PopupDisplay";

export default async function Layout(props: { children: ReactNode }) {
  const queries = await getDehydratedQueries([
    {
      queryKey: [QueryKey.session],
      queryFn: () => getServerSession(authOptions),
    },
  ]);

  return (
    <main className="min-h-screen flex flex-col">
      <HydrationBoundary state={{ queries, mutations: [] }}>
        <TopNavigation />
      </HydrationBoundary>
      <div className="flex-1 h-full max-w-[100vw] md:max-w-[1900px] mx-auto px-2 w-full md:mb-0">
        {props.children}
      </div>

      <div
        id="mobile-banners"
        className="flex flex-col md:hidden gap-4 mt-4 mb-20 px-4"
      >
        <PartnerBanners position="all" displayMode="all" />
      </div>
      <MainFooterWidget />
      {/* Mobile Only bottom nav menu */}
      <MobileBottomNav />
      {/* Popup Display */}
      <PopupDisplay />
    </main>
  );
}
