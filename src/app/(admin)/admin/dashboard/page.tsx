import { LevelDashboardCard } from "@/components/2_molecules/LevelDashboardCard";
import { SystemDashboardCard } from "@/components/2_molecules/SystemDashboardCard";
import { UserDashboardCard } from "@/components/2_molecules/UserDashboardCard";

import { RealKpiRow } from "./_components/RealKpiRow";
import { RealUserTrendCard } from "./_components/RealUserTrendCard";
import { RealTradeTrendCard } from "./_components/RealTradeTrendCard";
import { RealTopTradersCard } from "./_components/RealTopTradersCard";
import { RealRatingDistributionCard } from "./_components/RealRatingDistributionCard";
import { RealRecentReportsCard } from "./_components/RealRecentReportsCard";
import { RealTopicActivityCard } from "./_components/RealTopicActivityCard";
import { RealSystemHealthCard } from "./_components/RealSystemHealthCard";

export default function Dashboard() {
  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
          <p className="text-sm text-muted-foreground">
            플랫폼 운영 현황 한눈에 보기
          </p>
        </div>
      </div>

      <RealKpiRow />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <RealUserTrendCard />
        <RealTradeTrendCard />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <RealTopTradersCard />
        <RealRatingDistributionCard />
        <RealSystemHealthCard />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <RealRecentReportsCard />
        <RealTopicActivityCard />
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            현재 설정 요약
          </h3>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <SystemDashboardCard />
          <LevelDashboardCard />
          <UserDashboardCard />
        </div>
      </div>
    </section>
  );
}
