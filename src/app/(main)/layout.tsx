import type { ReactNode } from "react";
import { TopNavigationServer } from "@/components/3_organisms/TopNavigationServer";
import { MobileBottomNavServer } from "@/components/1_atoms/MobileBottomNavServer";
import { getDehydratedQueries } from "@/helpers/query";
import { QueryKey } from "@/helpers/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { HydrationBoundary } from "@tanstack/react-query";
import { PopupDisplay } from "@/components/3_organisms/PopupDisplay";
import { ResponsiveChatWidget } from "@/components/3_organisms/ResponsiveChatWidget";

export const dynamic = "force-dynamic";

export default async function Layout(props: { children: ReactNode }) {
  const queries = await getDehydratedQueries([
    {
      queryKey: [QueryKey.session],
      queryFn: () => getServerSession(authOptions),
    },
  ]);

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden">
      <HydrationBoundary state={{ queries, mutations: [] }}>
        <TopNavigationServer />
      </HydrationBoundary>
      <div className="flex-1 min-h-0 max-w-[100vw] md:max-w-[1900px] mx-auto px-2 w-full flex gap-4">
        <ResponsiveChatWidget />
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hide">
          <div className="flex flex-col">{props.children}</div>
        </div>
      </div>
      {/* Mobile Only bottom nav menu */}
      <MobileBottomNavServer />
      {/* Popup Display */}
      <PopupDisplay />
    </main>
  );
}
