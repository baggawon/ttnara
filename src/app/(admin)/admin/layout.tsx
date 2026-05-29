import type { ReactNode } from "react";
import { AdminTopNavigation } from "@/components/3_organisms/AdminTopNavigation";
import { getSpecialTopic } from "@/helpers/server/specialBoard";

export const dynamic = "force-dynamic";

export default async function Layout(props: { children: ReactNode }) {
  // The "홈 게시판" menu lights up only when a topic is designated as the
  // card-format home board. Fetching this server-side keeps the nav state
  // accurate on first paint without a client round-trip.
  const specialTopic = await getSpecialTopic();
  const hasFullviewTopic = specialTopic !== null;

  return (
    <main className="min-h-screen flex flex-col">
      <AdminTopNavigation hasFullviewTopic={hasFullviewTopic} />
      <div className="flex-1 h-full w-full mx-auto px-3 sm:px-6 lg:px-8 pb-6">
        {props.children}
      </div>
    </main>
  );
}
