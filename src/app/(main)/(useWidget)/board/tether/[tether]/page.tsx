import { TetherDetail } from "@/app/(main)/(useWidget)/board/tether/[tether]/TetherDetail";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import type { TetherListResponse } from "@/app/api/tethers/read";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { HydrationBoundary } from "@tanstack/react-query";

const getProps = async (props: {
  params: Params;
  searchParams: SearchParams;
}) => {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const tether_id = Number(params.tether);
  const password = searchParams.password
    ? (searchParams.password as string)
    : undefined;

  const pagination = {
    ...(typeof tether_id === "number" && { id: tether_id }),
    ...(password && { password }),
  };

  return { password, tether_id, pagination };
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
    title: `${product.tethers?.[0]?.title} - P2P 거래 - 테더나라`,
  };
}

type Params = Promise<{ tether: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { tether_id, password, pagination } = await getProps(props);

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
      <TetherDetail tether_id={tether_id} password={password} />
    </HydrationBoundary>
  );
}
