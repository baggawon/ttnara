import { RealKpiRow } from "./_components/RealKpiRow";
import { RealUserTrendCard } from "./_components/RealUserTrendCard";
import { RealTradeTrendCard } from "./_components/RealTradeTrendCard";
import { RealVolumeTrendCard } from "./_components/RealVolumeTrendCard";
import { RealRatingTrendCard } from "./_components/RealRatingTrendCard";
import { RealTradeFunnelCard } from "./_components/RealTradeFunnelCard";
import { RealOpenProposalsAgingCard } from "./_components/RealOpenProposalsAgingCard";
import { RealRetentionCard } from "./_components/RealRetentionCard";
import { RealTopTradersCard } from "./_components/RealTopTradersCard";
import { RealRatingDistributionCard } from "./_components/RealRatingDistributionCard";
import { RealVerificationFunnelCard } from "./_components/RealVerificationFunnelCard";
import { RealModerationActivityCard } from "./_components/RealModerationActivityCard";
import { RealSystemHealthCard } from "./_components/RealSystemHealthCard";
import { RealRecentReportsCard } from "./_components/RealRecentReportsCard";
import { RealTopicActivityCard } from "./_components/RealTopicActivityCard";
import { SettingsSummaryCard } from "./_components/SettingsSummaryCard";

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="pt-3">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <section className="w-full flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
          <p className="text-sm text-muted-foreground">
            플랫폼 운영 현황 한눈에 보기
          </p>
        </div>
      </div>

      <SectionHeading title="핵심 지표" description="오늘의 운영 현황 요약" />
      <RealKpiRow />

      <SectionHeading
        title="사용자 & 성장"
        description="신규 가입 · 활성 사용자 · 리텐션 · 인증 현황"
      />
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <RealUserTrendCard />
        <RealRetentionCard />
        <RealVerificationFunnelCard />
      </div>

      <SectionHeading
        title="거래"
        description="거래량 · 완료율 · 평점 · 상위 거래자"
      />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <RealTradeTrendCard />
        <RealVolumeTrendCard />
        <RealRatingTrendCard />
        <RealTradeFunnelCard />
        <RealOpenProposalsAgingCard />
        <RealTopTradersCard />
        <RealRatingDistributionCard />
      </div>

      <SectionHeading
        title="운영 & 안전"
        description="모더레이션 · 신고 · 채팅 활동"
      />
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <RealModerationActivityCard />
        <RealRecentReportsCard />
        <RealTopicActivityCard />
      </div>

      <SectionHeading
        title="시스템 & 설정"
        description="시스템 상태 및 주요 설정 요약"
      />
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <RealSystemHealthCard />
        <SettingsSummaryCard />
      </div>
    </section>
  );
}
