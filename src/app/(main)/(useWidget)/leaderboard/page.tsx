import { authOptions } from "@/app/api/auth/[...nextauth]";
import LeaderboardWidget from "@/components/3_organisms/LeaderboardWidget";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { HydrationBoundary } from "@tanstack/react-query";
import { requireTetherEnabled } from "@/helpers/server/tetherGuard";
import { buildPageTitle } from "@/helpers/server/brandSettings";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: await buildPageTitle("랭킹"),
});

export default async function Page() {
  await requireTetherEnabled();

  const queries = await getDehydratedQueries([
    {
      queryKey: [QueryKey.session],
      queryFn: () => getServerSession(authOptions),
    },
    {
      queryKey: [{ [QueryKey.leaderboard]: { period: "total" } }],
      queryFn: async () =>
        serverGet(ApiRoute.leaderboardRead, { period: "total" }),
    },
  ]);

  return (
    <HydrationBoundary state={{ queries, mutations: [] }}>
      <LeaderboardWidget />
    </HydrationBoundary>
  );
}
