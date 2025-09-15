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
      <div>
        <h3 className="text-lg font-medium">알림 내역</h3>
        <p className="text-sm text-muted-foreground">알림 내역을 관리합니다.</p>
      </div>
      <Separator />
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
