import { authOptions } from "@/app/api/auth/[...nextauth]";
import NoticeTableWidget from "@/components/3_organisms/NoticeTableWidget";
import RankingWidget from "@/components/3_organisms/RankingWidget";
import { BoardPreviewSection } from "@/components/3_organisms/BoardPreviewWidget";
import { Seo } from "@/components/4_templates/Seo";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { getServerSession } from "next-auth";
import { HydrationBoundary } from "@tanstack/react-query";
import { PartnerBanners } from "@/components/1_atoms/PartnerBanners";
import { isTetherEnabled } from "@/helpers/server/tetherGuard";
import { isSeoVisible } from "@/helpers/server/homeVisibility";
import { SpecialBoardSection } from "@/components/3_organisms/SpecialBoardSection";
import { getBrandSettings } from "@/helpers/server/brandSettings";
import { HomeHeroBanner } from "./HomeHeroBanner";

export default async function Page() {
  const brand = await getBrandSettings();
  const tetherEnabled = await isTetherEnabled();
  const seoVisible = await isSeoVisible();
  const boardPreviewData = await serverGet(ApiRoute.boardPreviewRead);
  const hasBoardPreview = Boolean(boardPreviewData?.topics?.length);
  const baseQueries = [
    {
      queryKey: [QueryKey.session],
      queryFn: () => getServerSession(authOptions),
    },
    {
      queryKey: [QueryKey.summaryThreads],
      queryFn: async () => serverGet(ApiRoute.summaryThreadsRead),
    },
    {
      queryKey: [QueryKey.boardPreview],
      queryFn: async () => boardPreviewData,
    },
  ];
  const tetherQueries = tetherEnabled
    ? [
        {
          queryKey: [{ [QueryKey.leaderboard]: { period: "total" } }],
          queryFn: async () =>
            serverGet(ApiRoute.leaderboardRead, { period: "total" }),
        },
      ]
    : [];
  const queries = await getDehydratedQueries([
    ...baseQueries,
    ...tetherQueries,
  ]);

  // The 3-column layout only makes sense when the tether widgets (Notice +
  // Ranking) are present alongside the board preview. With tether disabled the
  // board preview is the sole child, so keep it at 2 columns and let it span
  // full width instead of collapsing into a 1/3-width column at 4xl.
  const gridColsClass =
    tetherEnabled && hasBoardPreview
      ? "grid-cols-1 md:grid-cols-2 4xl:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";

  return (
    <section className="flex-1 flex flex-col gap-4">
      <HomeHeroBanner
        imageUrl={brand.heroImageUrl}
        actionUrl={brand.heroActionUrl}
      />
      <SpecialBoardSection />
      <HydrationBoundary state={{ queries, mutations: [] }}>
        <div className={`grid ${gridColsClass} gap-4`}>
          {tetherEnabled && (
            <div className="min-h-[720px]">
              <NoticeTableWidget />
            </div>
          )}
          {tetherEnabled && (
            <div className="min-h-[720px]">
              <RankingWidget />
            </div>
          )}
          {hasBoardPreview && (
            <BoardPreviewSection standalone={!tetherEnabled} />
          )}
        </div>
      </HydrationBoundary>
      <div className="xl:hidden">
        <PartnerBanners variant="inline" />
      </div>
      {seoVisible && <Seo />}
    </section>
  );
}
