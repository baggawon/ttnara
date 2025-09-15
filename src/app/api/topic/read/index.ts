import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { ToastData } from "@/helpers/toastData";
import type { topic, category } from "@prisma/client";

export interface TopicSettings
  extends Pick<
    topic,
    | "id"
    | "name"
    | "url"
    | "is_active"
    | "show_quickmenu"
    | "preview_on_homepage"
    | "fullview_on_homepage"
    | "single_comment_only"
    | "max_thread_title_length"
    | "max_thread_content_length"
    | "max_thread_comment_length"
    | "min_thread_title_length"
    | "min_thread_content_length"
    | "min_thread_comment_length"
    | "level_read"
    | "level_create"
    | "level_comment"
    | "level_download"
    | "level_moderator"
    | "use_upload_file"
    | "allowed_file_extensions"
    | "max_file_size_mb"
    | "max_upload_items"
    | "use_thumbnail"
    | "use_anonymous"
    | "use_upvote"
    | "use_downvote"
    | "thread_page_size"
    | "thread_page_nav_size"
    | "points_per_post_create"
    | "points_per_post_read"
    | "points_per_comment_create"
    | "points_per_file_download"
    | "points_per_upvote"
    | "points_per_downvote"
    | "thread_disable_edit"
    | "thread_disable_delete"
  > {
  categories: category[];
}

export interface TopicReadProps {
  topic_url: string;
}

async function getTopicSettings(
  queryParams: TopicReadProps
): Promise<TopicSettings> {
  const { topic_url } = queryParams;

  const topics = appCache.getByKey(CacheKey.Topics) as any;

  if (!topics[topic_url]) {
    throw ToastData.unknown;
  }

  const topic = topics[topic_url];
  const categories: category[] = [];

  // Convert categories object to array
  if (topic.categories) {
    Object.values(topic.categories).forEach((category: any) => {
      categories.push(category);
    });
  }

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
    categories: categories,
  };

  return topicSettings;
}

export async function GET(queryParams: any) {
  try {
    const response = await getTopicSettings(queryParams as TopicReadProps);
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
