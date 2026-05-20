import { TetherDetail } from "@/app/(main)/(useWidget)/board/tether/[tether]/TetherDetail";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import type { TetherListResponse } from "@/app/api/tethers/read";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { HydrationBoundary } from "@tanstack/react-query";
import { requireTetherEnabled } from "@/helpers/server/tetherGuard";
import { buildPageTitle } from "@/helpers/server/brandSettings";

const getProps = async (props: {
  params: Params;
  searchParams: SearchParams;
}) => {
  const [params] = await Promise.all([props.params, props.searchParams]);

  const tether_id = Number(params.tether);

  const pagination = {
    ...(typeof tether_id === "number" && { id: tether_id }),
  };

  return { tether_id, pagination };
};

export async function generateMetadata(props: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { pagination } = await getProps(props);
  const product: TetherListResponse = await serverGet(
    ApiRoute.tethersRead,
    pagination
  );

  return {
    title: await buildPageTitle(`${product.tethers?.[0]?.title} - P2P 거래`),
  };
}

type Params = Promise<{ tether: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireTetherEnabled();

  const { tether_id, pagination } = await getProps(props);

  const queries = await getDehydratedQueries([
    {
      queryKey: [QueryKey.session],
      queryFn: () => getServerSession(authOptions),
    },
    {
      queryKey: [
        {
          [QueryKey.tethers]: pagination,
        },
      ],
      queryFn: () => serverGet(ApiRoute.tethersRead, pagination),
    },
  ]);

  return (
    <HydrationBoundary state={{ queries, mutations: [] }}>
      <TetherDetail tether_id={tether_id} />
    </HydrationBoundary>
  );
}
