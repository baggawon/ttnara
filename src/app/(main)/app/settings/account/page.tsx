import SettingsView from "@/app/(main)/app/settings/account/view";
import ProfileHero from "@/app/(main)/app/settings/account/ProfileHero";
import { getDisplaySettings } from "@/helpers/server/displaySettings";

export default async function Page() {
  const { showTradeRank, showBoardRank } = await getDisplaySettings();
  return (
    <div className="space-y-6">
      <ProfileHero
        showTradeRank={showTradeRank}
        showBoardRank={showBoardRank}
      />
      <SettingsView />
    </div>
  );
}
