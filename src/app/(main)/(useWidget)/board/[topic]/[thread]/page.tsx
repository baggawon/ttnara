import { ThreadDetailPage } from "@/app/(main)/(useWidget)/board/[topic]/[thread]/ThreadDetailPage";
import { BoardAccessService, BoardAccessError } from "@/lib/boardAccess";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { redirect } from "next/navigation";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import type { Metadata } from "next";
import type { TopicSettings } from "@/app/api/topic/read";
import { serverGet } from "@/helpers/server/get";
import { getDehydratedQueries } from "@/helpers/query";
import type { ThreadWithProfile } from "@/app/api/threads/read";
import { HydrationBoundary } from "@tanstack/react-query";

const getProps = async (props: {
  params: Params;
  searchParams: SearchParams;
}) => {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const topic_url = params.topic;
  const thread_id = Number(params.thread);

  const page = searchParams.page ? Number(searchParams.page) : undefined;
  const category_name = searchParams.category_name
    ? (searchParams.category_name as string)
    : undefined;
  const search = searchParams.search
    ? (searchParams.search as string)
    : undefined;
  const column = searchParams.column
    ? (searchParams.column as string)
    : undefined;

  return {
    page,
    thread_id,
    category_name,
    topic_url,
    search,
    column,
  };
};

export async function generateMetadata(props: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { topic_url, thread_id } = await getProps(props);
  const [settings, currentThread]: [TopicSettings, ThreadWithProfile] =
    await Promise.all([
      serverGet(ApiRoute.topicSettingsRead, {
        topic_url,
      }),
      serverGet(ApiRoute.threadRead, { topic_url, thread_id }),
    ]);

  return {
    title: `${currentThread?.title} - ${settings?.name ?? ""} - 테더나라`,
  };
}

type Params = Promise<{ topic: string; thread: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { page, thread_id, category_name, topic_url, search, column } =
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
      queryKey: [{ [QueryKey.thread]: { topic_url, thread_id } }],
      queryFn: () => serverGet(ApiRoute.threadRead, { topic_url, thread_id }),
    },
  ]);

  // Server-side validation
  try {
    const access = await BoardAccessService.fromSession({
      session: queries[0].state.data as Session | null,
      topic_url,
      topicSettings: queries[1].state.data,
    });

    if (!access.canRead()) {
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
      <ThreadDetailPage
        page={page}
        category_name={category_name}
        topic_url={topic_url}
        thread_id={thread_id}
        search={search}
        column={column}
      />
    </HydrationBoundary>
  );
}
