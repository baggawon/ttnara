import {
  Prisma,
  type profile,
  type user,
  type category,
  type comment,
  type thread,
} from "@prisma/client";
import type { TopicSettings } from "@/app/api/topic/read";
import { forEach } from "@/helpers/basic";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { paginationManager } from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { SearchType, type PaginationInfo } from "@/helpers/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";

export interface ThreadVoteInfo {
  user_id: string;
  vote_type: string;
}

export interface ThreadWithProfile extends thread {
  author: SimpleProfile | null;
  comments: CommentWithProfile[];
  images: { aws_cloud_front_url: string }[];
  votes?: ThreadVoteInfo[];
}

export interface CommentWithProfile extends comment {
  author: SimpleProfile | null;
}

export interface SimpleProfile extends Pick<user, "username"> {
  profile: Pick<profile, "displayname" | "is_app_admin" | "auth_level"> | null;
}

export interface ThreadListResponse {
  threads: ThreadWithProfile[];
  pagination: PaginationInfo;
  name: string;
  categories: category[];
  topic_id: number;
  use_thumbnail: boolean;
  default_thumbnail_url: string | null;
  settings: TopicSettings;
}

export interface ThreadsReadProps {
  page: number;
  order?: "asc" | "desc";
  search?: string;
  column?: string;
  topic_url: string;
  category_name?: string;
  thread_id?: number;
}

export const threadInclude = {
  author: {
    select: {
      username: true,
      profile: {
        select: {
          displayname: true,
          is_app_admin: true,
          auth_level: true,
        },
      },
    },
  },
  comments: {
    include: {
      author: {
        select: {
          username: true,
          profile: {
            select: {
              displayname: true,
              is_app_admin: true,
              auth_level: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: Prisma.SortOrder.asc,
    },
  },
};

export const threadDetailInclude = {
  ...threadInclude,
  votes: {
    select: {
      user_id: true,
      vote_type: true,
    },
  },
};

async function getTopicThreadsWithPagination(
  queryParams: any
): Promise<ThreadListResponse> {
  const json = queryParams as any as ThreadsReadProps;

  const topics = appCache.getByKey(CacheKey.Topics) as any;

  if (
    !topics[json.topic_url] ||
    (topics[json.topic_url] &&
      json.category_name &&
      !topics[json.topic_url].categories[json.category_name])
  )
    throw ToastData.unknown;

  const categories: category[] = [];
  const topic_id = topics[json.topic_url].id;
  forEach(
    Object.values(topics[json.topic_url].categories) as any,
    (category: category) => {
      categories.push(category);
    }
  );

  const topic = topics[json.topic_url];
  const use_thumbnail = topic.use_thumbnail;

  const threadGeneralSettings = appCache.getByKey(
    CacheKey.ThreadGeneralSettings
  ) as { default_thumbnail_url?: string | null } | undefined;
  const rawDefaultThumb = threadGeneralSettings?.default_thumbnail_url ?? null;
  const default_thumbnail_url = rawDefaultThumb
    ? signStoredCloudFrontUrl(rawDefaultThumb)
    : null;

  const topicSettings: TopicSettings = {
    id: topic.id,
    name: topic.name,
    url: topic.url,
    is_active: topic.is_active,
    show_quickmenu: topic.show_quickmenu,
    preview_on_homepage: topic.preview_on_homepage,
    fullview_on_homepage: topic.fullview_on_homepage,
    single_comment_only: topic.single_comment_only,
    max_thread_title_length: topic.max_thread_title_length,
    max_thread_content_length: topic.max_thread_content_length,
    max_thread_comment_length: topic.max_thread_comment_length,
    min_thread_title_length: topic.min_thread_title_length,
    min_thread_content_length: topic.min_thread_content_length,
    min_thread_comment_length: topic.min_thread_comment_length,
    level_read: topic.level_read,
    level_create: topic.level_create,
    level_comment: topic.level_comment,
    level_download: topic.level_download,
    level_moderator: topic.level_moderator,
    use_upload_file: topic.use_upload_file,
    allowed_file_extensions: topic.allowed_file_extensions,
    max_file_size_mb: topic.max_file_size_mb,
    max_upload_items: topic.max_upload_items,
    use_thumbnail: topic.use_thumbnail,
    use_anonymous: topic.use_anonymous,
    use_mypostonly: topic.use_mypostonly,
    use_upvote: topic.use_upvote,
    use_downvote: topic.use_downvote,
    thread_page_size: topic.thread_page_size,
    thread_page_nav_size: topic.thread_page_nav_size,
    points_per_post_create: topic.points_per_post_create,
    points_per_post_read: topic.points_per_post_read,
    points_per_comment_create: topic.points_per_comment_create,
    points_per_file_download: topic.points_per_file_download,
    points_per_upvote: topic.points_per_upvote,
    points_per_downvote: topic.points_per_downvote,
    thread_disable_edit: topic.thread_disable_edit,
    thread_disable_delete: topic.thread_disable_delete,
    categories,
  };

  const manager = paginationManager(json);

  if (typeof json.thread_id === "number" && json.thread_id === 0) {
    return {
      threads: [],
      pagination: manager.getPagination(),
      name: topic.name,
      categories,
      topic_id,
      use_thumbnail,
      default_thumbnail_url,
      settings: topicSettings,
    };
  }

  if (typeof json.thread_id === "number") {
    await handleConnect((prisma) =>
      prisma.thread.update({
        where: {
          id: json.thread_id,
        },
        data: {
          views: {
            increment: 1,
          },
        },
      })
    );
  }

  const where: Prisma.threadWhereInput = {
    topic_id,
    ...(json.category_name && {
      category_id: topics[json.topic_url].categories[json.category_name].id,
    }),
  };

  if (json.search) {
    switch (json.column) {
      case SearchType.제목:
        where.OR = [{ title: { contains: json.search } }];
        break;
      case SearchType.내용:
        where.OR = [{ content: { contains: json.search } }];
        break;
      case SearchType.제목_내용:
        where.OR = [
          { title: { contains: json.search } },
          { content: { contains: json.search } },
        ];
        break;
      case SearchType.회원아이디:
        where.OR = [
          {
            author: { username: { contains: json.search } },
          },
        ];
      case SearchType.글쓴이:
        where.OR = [
          {
            author: {
              profile: { displayname: { contains: json.search } },
            },
          },
        ];
    }
  }

  // use_mypostonly: 익명 글은 작성자 본인과 관리자만 열람 가능
  if (topic.use_mypostonly) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const isAdmin = session?.user?.is_app_admin ?? false;

    if (!isAdmin) {
      const mypostFilter: Prisma.threadWhereInput = {
        OR: [{ is_secret: false }, { author_id: userId ?? "" }],
      };
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        mypostFilter,
      ];
    }
  }

  const { page, pageSize } = manager.getPageInfo();

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.thread.count({ where }),

      prisma.thread.findMany({
        where,
        orderBy: [{ is_notice: "desc" }, { created_at: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: threadInclude,
      }),
    ])
  );
  if (!result) throw ToastData.unknown;
  const totalCount = result[0];
  const threads = result[1];

  if (!threads || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  // Resolve thumbnails from media_upload: prefer thread.thumbnail_media_id, else first uploaded.
  const threadsWithImages = threads.map((t) => ({
    ...t,
    images: [] as { aws_cloud_front_url: string }[],
  }));

  if (use_thumbnail && threadsWithImages.length > 0) {
    const threadIds = threadsWithImages.map((t) => t.id);
    const mediaRows = await handleConnect((prisma) =>
      prisma.media_upload.findMany({
        where: {
          attached_to_type: "thread",
          attached_to_id: { in: threadIds },
          media_type: "image",
        },
        select: {
          id: true,
          attached_to_id: true,
          aws_cloud_front_url: true,
        },
        orderBy: { id: Prisma.SortOrder.asc },
      })
    );

    const byThread = new Map<
      number,
      { id: number; aws_cloud_front_url: string }[]
    >();
    for (const row of mediaRows ?? []) {
      if (row.attached_to_id == null) continue;
      const arr = byThread.get(row.attached_to_id) ?? [];
      arr.push({ id: row.id, aws_cloud_front_url: row.aws_cloud_front_url });
      byThread.set(row.attached_to_id, arr);
    }

    for (const t of threadsWithImages) {
      const candidates = byThread.get(t.id) ?? [];
      if (candidates.length === 0) continue;
      const chosen =
        (t.thumbnail_media_id != null &&
          candidates.find((c) => c.id === t.thumbnail_media_id)) ||
        candidates[0];
      t.images = [
        {
          aws_cloud_front_url: signStoredCloudFrontUrl(
            chosen.aws_cloud_front_url
          ),
        },
      ];
    }
  }

  return {
    threads: threadsWithImages as ThreadWithProfile[],
    pagination: manager.getPagination(),
    name: topic.name,
    categories,
    topic_id,
    use_thumbnail,
    default_thumbnail_url,
    settings: topicSettings,
  };
}

export async function GET(queryParams: any) {
  try {
    const response = await getTopicThreadsWithPagination(queryParams);
    return {
      result: true,
      data: response,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
}
