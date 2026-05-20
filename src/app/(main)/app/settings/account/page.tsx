import SettingsView from "@/app/(main)/app/settings/account/view";
import ProfileHero from "@/app/(main)/app/settings/account/ProfileHero";

export default function Page() {
  return (
    <div className="space-y-6">
      <ProfileHero />
      <SettingsView />
    </div>
  );
}
