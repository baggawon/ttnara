import SettingsNotificationView from "@/app/(main)/app/settings/notification/view";
import { Separator } from "@/components/ui/separator";
export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">알림 설정</h3>
        <p className="text-sm text-muted-foreground">알림 설정을 관리합니다.</p>
      </div>
      <Separator />
      <SettingsNotificationView />
    </div>
  );
}
