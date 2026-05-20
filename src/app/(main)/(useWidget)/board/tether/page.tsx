import { authOptions } from "@/app/api/auth/[...nextauth]";
import type { TethersReadProps } from "@/app/api/tethers/read";
import { TetherCardList } from "@/components/4_templates/TetherCardList";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import {
  ApiRoute,
  QueryKey,
  type Currency,
  TetherOrderby,
  TetherRange,
  TetherStatus,
} from "@/helpers/types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { HydrationBoundary } from "@tanstack/react-query";
import { requireTetherEnabled } from "@/helpers/server/tetherGuard";
import { buildPageTitle } from "@/helpers/server/brandSettings";

const getProps = async (props: { searchParams: SearchParams }) => {
  const searchParams = await props.searchParams;

  const page = searchParams.page ? Number(searchParams.page) : undefined;
  const pageSize = searchParams.pageSize
    ? Number(searchParams.pageSize)
    : undefined;
  const category_name = searchParams.category_name
    ? (searchParams.category_name as string)
    : undefined;
  const currency = searchParams.currency
    ? (searchParams.currency as Currency)
    : undefined;
  const orderby =
    (searchParams.orderby as TetherOrderby) || TetherOrderby.PriceCheap;
  const status = searchParams.status
    ? (searchParams.status as TetherStatus)
    : undefined;
  const range = searchParams.range
    ? (searchParams.range as TetherRange)
    : undefined;
  const region = searchParams.region
    ? (searchParams.region as string)
    : undefined;
  const search = searchParams.search
    ? (searchParams.search as string)
    : undefined;
  const column = searchParams.column
    ? (searchParams.column as string)
    : undefined;

  const pagination: TethersReadProps = {
    page: 1,
    pageSize: 20,
    range: TetherRange.Total,
    orderby,
    status: TetherStatus.Open,
    ...(page && { page }),
    ...(pageSize && { pageSize }),
    ...(currency && { currency }),
    ...(category_name && { category_name }),
    ...(status && { status }),
    ...(range && { range }),
    ...(region && { region }),
    ...(search && { search }),
    ...(column && { column }),
  };

  return {
    pagination,
    page,
    pageSize,
    currency,
    category_name,
    orderby,
    status,
    range,
    region,
    search,
    column,
  };
};

export const generateMetadata = async (): Promise<Metadata> => ({
  title: await buildPageTitle("P2P 거래"),
});

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
  await requireTetherEnabled();

  const {
    pagination,
    page,
    pageSize,
    currency,
    category_name,
    orderby,
    status,
    range,
    region,
    search,
    column,
  } = await getProps(props);

  const queries = await getDehydratedQueries([
    {
      queryKey: [QueryKey.session],
      queryFn: () => getServerSession(authOptions),
    },
    {
      queryKey: [{ [QueryKey.tethers]: pagination }],
      queryFn: async () => serverGet(ApiRoute.tethersRead, pagination),
    },
  ]);

  return (
    <HydrationBoundary state={{ queries, mutations: [] }}>
      <TetherCardList
        page={page}
        pageSize={pageSize}
        category_name={category_name}
        currency={currency}
        orderby={orderby}
        status={status}
        range={range}
        region={region}
        search={search}
        column={column}
      />
    </HydrationBoundary>
  );
}
