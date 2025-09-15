import { authOptions } from "@/app/api/auth/[...nextauth]";
import type { TethersReadProps } from "@/app/api/tethers/read";
import { TetherList } from "@/components/4_templates/TetherList";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import {
  ApiRoute,
  QueryKey,
  type Currency,
  type TetherOrderby,
  TetherRange,
  type TetherStatus,
} from "@/helpers/types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { HydrationBoundary } from "@tanstack/react-query";

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
  const orderby = searchParams.orderby
    ? (searchParams.orderby as TetherOrderby)
    : undefined;
  const status = searchParams.status
    ? (searchParams.status as TetherStatus)
    : undefined;
  const range = searchParams.range
    ? (searchParams.range as TetherRange)
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
    range: TetherRange.In24Hours,
    ...(page && { page }),
    ...(pageSize && { pageSize }),
    ...(currency && { currency }),
    ...(category_name && { category_name }),
    ...(orderby && { orderby }),
    ...(status && { status }),
    ...(range && { range }),
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
    search,
    column,
  };
};

export const metadata: Metadata = {
  title: "P2P 거래 - 테더나라",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
  const {
    pagination,
    page,
    pageSize,
    currency,
    category_name,
    orderby,
    status,
    range,
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
      <TetherList
        page={page}
        pageSize={pageSize}
        category_name={category_name}
        currency={currency}
        orderby={orderby}
        status={status}
        range={range}
        search={search}
        column={column}
      />
    </HydrationBoundary>
  );
}
