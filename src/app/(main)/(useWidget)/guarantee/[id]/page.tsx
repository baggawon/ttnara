import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import GuaranteeDetailPage from "./GuaranteeDetailPage";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { buildPageTitle } from "@/helpers/server/brandSettings";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: await buildPageTitle("공식보증업체 상세"),
});

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page(props: Props) {
  const { id } = await props.params;
  const queries = await getDehydratedQueries([
    {
      queryKey: [QueryKey.guaranteeCompanies, "public"],
      queryFn: async () => serverGet(ApiRoute.guaranteeRead),
    },
  ]);

  return (
    <HydrationBoundary state={{ queries, mutations: [] }}>
      <GuaranteeDetailPage id={Number(id)} />
    </HydrationBoundary>
  );
}
