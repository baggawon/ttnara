import SettingsNotificationListView from "@/app/(main)/app/settings/notification_list/view";
import { Separator } from "@/components/ui/separator";
import { getBoolean } from "@/helpers/basic";
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  const page = searchParams.page ? Number(searchParams.page) : undefined;
  const pageSize = searchParams.pageSize
    ? Number(searchParams.pageSize)
    : undefined;
  const isRead = searchParams.isRead
    ? getBoolean(searchParams.isRead)
    : undefined;
  const search = searchParams.search
    ? (searchParams.search as string)
    : undefined;
  const column = searchParams.column
    ? (searchParams.column as string)
    : undefined;

  return (
    <div className="space-y-6">
      <SettingsNotificationListView
        page={page}
        pageSize={pageSize}
        isRead={isRead}
        search={search}
        column={column}
      />
    </div>
  );
}
