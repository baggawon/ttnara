import { ThreadEditor } from "@/app/(main)/(useWidget)/board/[topic]/edit/[thread]/ThreadEdit";
import { BoardAccessService, BoardAccessError } from "@/lib/boardAccess";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { redirect } from "next/navigation";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import type { Metadata } from "next";
import { serverGet } from "@/helpers/server/get";
import type { TopicSettings } from "@/app/api/topic/read";
import type { ThreadWithProfile } from "@/app/api/threads/read";
import { HydrationBoundary } from "@tanstack/react-query";
import { getDehydratedQueries } from "@/helpers/query";

const getProps = async (props: { params: Params }) => {
  const params = await props.params;

  const topic_url = params.topic;
  const thread_id = Number(params.thread);

  return {
    thread_id,
    topic_url,
  };
};

export async function generateMetadata(props: {
  params: Params;
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
    title: `${currentThread?.title ? "글 수정" : "새 글 작성"} - ${settings?.name ?? ""} - 테더나라`,
  };
}

type Params = Promise<{ topic: string; thread: string }>;

export default async function ThreadEdit(props: { params: Params }) {
  const { thread_id, topic_url } = await getProps(props);

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
      thread_id,
      topicSettings: queries[1].state.data,
      thread: queries[2].state.data,
    });

    if (thread_id === 0 && !access.canWrite()) {
      redirect(AppRoute.Main);
    } else if (thread_id > 0 && !access.canEdit()) {
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
      <ThreadEditor topic_url={topic_url} thread_id={thread_id} />
    </HydrationBoundary>
  );
}
