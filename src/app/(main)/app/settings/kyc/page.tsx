import { Separator } from "@/components/ui/separator";
import SettingsKYCView from "@/app/(main)/app/settings/kyc/view";
import { requireTetherEnabled } from "@/helpers/server/tetherGuard";

export default async function Page() {
  await requireTetherEnabled();

  return (
    <div className="space-y-6">
      <SettingsKYCView />
    </div>
  );
}
