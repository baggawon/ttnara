import SettingsView from "@/app/(main)/app/settings/account/view";
import { Separator } from "@/components/ui/separator";
export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">내 정보</h3>
        <p className="text-sm text-muted-foreground">
          비밀번호와 이메일을 관리합니다.
        </p>
      </div>
      <Separator />
      <SettingsView />
    </div>
  );
}
