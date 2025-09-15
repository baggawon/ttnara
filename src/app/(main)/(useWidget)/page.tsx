import { authOptions } from "@/app/api/auth/[...nextauth]";
import NoticeTableWidget from "@/components/3_organisms/NoticeTableWidget";
import { Seo } from "@/components/4_templates/Seo";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { getServerSession } from "next-auth";
import { HydrationBoundary } from "@tanstack/react-query";
import { PartnerBanners } from "@/components/1_atoms/PartnerBanners";

export default async function Page() {
  const queries = await getDehydratedQueries([
    {
      queryKey: [QueryKey.session],
      queryFn: () => getServerSession(authOptions),
    },
    {
      queryKey: [QueryKey.summaryThreads],
      queryFn: async () => serverGet(ApiRoute.summaryThreadsRead),
    },
  ]);

  return (
    <section className="flex-1 flex flex-col gap-4">
      <HydrationBoundary state={{ queries, mutations: [] }}>
        <NoticeTableWidget />
      </HydrationBoundary>
      <PartnerBanners position="all" displayMode="mobile" />
      <Seo />
    </section>
  );
}
