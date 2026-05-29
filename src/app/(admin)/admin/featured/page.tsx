import { getSpecialTopic } from "@/helpers/server/specialBoard";
import { AdminAppRoute } from "@/helpers/types";
import { redirect } from "next/navigation";
import { FeaturedManager } from "@/app/(admin)/admin/featured/FeaturedManager";

export default async function FeaturedPage() {
  // Defense-in-depth: the menu item is already disabled when no fullview topic
  // exists, but the route is still reachable by URL. Bounce to the topics list
  // so admins can designate one.
  const topic = await getSpecialTopic();
  if (!topic) {
    redirect(AdminAppRoute.Boards);
  }

  return (
    <FeaturedManager
      topicId={topic.id}
      topicName={topic.name}
      topicUrl={topic.url}
      topicCategories={topic.categories}
      uploadSettings={{
        use_upload_file: topic.use_upload_file,
        max_upload_items: topic.max_upload_items,
        max_file_size_mb: topic.max_file_size_mb,
        allowed_file_extensions: topic.allowed_file_extensions,
        use_thumbnail: topic.use_thumbnail,
      }}
    />
  );
}
