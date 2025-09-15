import { getDehydratedQueries } from "@/helpers/query";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { serverGet } from "@/helpers/server/get";
import { TetherEditor } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/TetherEditor";
import type { Metadata } from "next";
import type { TetherListResponse } from "@/app/api/tethers/read";
import { HydrationBoundary } from "@tanstack/react-query";

const getProps = async (props: { params: Params }) => {
  const params = await props.params;

  const tether_id = Number(params.tether);

  const pagination = {
    id: tether_id,
  };

  return { pagination, tether_id };
};

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { pagination } = await getProps(props);
  const product: TetherListResponse = await serverGet(
    ApiRoute.tethersRead,
    pagination
  );

  return {
    title: `${product.tethers?.[0]?.title ? "거래편집" : "거래추가"} - P2P 거래 - 테더나라`,
  };
}

type Params = Promise<{ tether: string }>;

export default async function Page(props: { params: Params }) {
  const { pagination, tether_id } = await getProps(props);

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
      <TetherEditor tether_id={tether_id} />
    </HydrationBoundary>
  );
}
