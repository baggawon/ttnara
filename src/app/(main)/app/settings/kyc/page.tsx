import { Separator } from "@/components/ui/separator";
import SettingsKYCView from "@/app/(main)/app/settings/kyc/view";
export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">KYC 인증</h3>
        <p className="text-sm text-muted-foreground">KYC 인증을 관리합니다.</p>
      </div>
      <Separator />
      <SettingsKYCView />
    </div>
  );
}
