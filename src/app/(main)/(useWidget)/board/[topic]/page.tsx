import { ThreadList } from "@/components/4_templates/ThreadList";
import { BoardAccessService, BoardAccessError } from "@/lib/boardAccess";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { redirect } from "next/navigation";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import type { Metadata } from "next";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import type { TopicSettings } from "@/app/api/topic/read";
import type { ThreadsReadProps } from "@/app/api/threads/read";
import { HydrationBoundary } from "@tanstack/react-query";
import type { Session } from "next-auth";

const getProps = async (props: {
  params: Params;
  searchParams: SearchParams;
}) => {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const page = searchParams.page ? Number(searchParams.page) : undefined;
  const category_name = searchParams.category_name
    ? (searchParams.category_name as string)
    : undefined;
  const topic_url = params.topic;
  const search = searchParams.search
    ? (searchParams.search as string)
    : undefined;
  const column = searchParams.column
    ? (searchParams.column as string)
    : undefined;

  const pagination: ThreadsReadProps = {
    page: 1,
    ...(page && { page }),
    ...(category_name && { category_name }),
    ...(search && { search }),
    ...(column && { column }),
    topic_url,
  };

  return {
    page,
    category_name,
    topic_url,
    search,
    column,
    pagination,
  };
};

export async function generateMetadata(props: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { topic_url } = await getProps(props);
  const settings: TopicSettings = await serverGet(ApiRoute.topicSettingsRead, {
    topic_url,
  });

  return {
    title: `${settings?.name ?? ""} - 테더나라`,
  };
}

type Params = Promise<{ topic: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { page, category_name, topic_url, search, column, pagination } =
    await getProps(props);

  const queries = await getDehydratedQueries([
    {
      queryKey: [QueryKey.session],
      queryFn: () => getServerSession(authOptions),
    },
    {
      queryKey: [{ [QueryKey.topicSettings]: { topic_url } }],
      queryFn: () => serverGet(ApiRoute.topicSettingsRead, { topic_url }),
    },
    {
      queryKey: [{ [QueryKey.threads]: pagination }],
      queryFn: () => serverGet(ApiRoute.threadsRead, pagination),
    },
  ]);

  // Server-side validation

  try {
    const access = await BoardAccessService.fromSession({
      session: queries[0].state.data as Session | null,
      topic_url,
      topicSettings: queries[1].state.data,
    });

    if (!access.isActive()) {
      redirect(AppRoute.Main);
    }
  } catch (error) {
    if (error instanceof BoardAccessError) {
      if (error.message === "NOT_FOUND") {
        redirect(AppRoute.Main);
      }
    }

    redirect(AppRoute.Main);
  }

  return (
    <HydrationBoundary state={{ queries, mutations: [] }}>
      <ThreadList
        page={page}
        category_name={category_name}
        topic_url={topic_url}
        search={search}
        column={column}
      />
    </HydrationBoundary>
  );
}
