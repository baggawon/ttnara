import "server-only";

// Offline / dev fallback for the Amado partner API. The live source is
// `amadoApi.ts` (fetches playamado.com); this bundled list is served only when
// that upstream is unreachable on a cold start. The shape here IS the contract
// every consumer codes against.
export interface AmadoEvent {
  id: string;
  title: string;
  category: string;
  // ISO datetime when the event resolves / its "moment of truth". Null when the
  // event has no markets yet (the date lives on the per-event markets upstream).
  moment_of_truth: string | null;
  thumbnail_url: string | null;
  detail_url: string;
  status: "open" | "closed" | "resolved";
  // Summed traded volume across the event's markets, in KRW. Null when unknown.
  volume_krw: number | null;
}

// Dates are anchored relative to 2026 so the dev data stays "future" through
// the rest of the year. Adjust as needed when real data lands.
export const MOCK_AMADO_EVENTS: AmadoEvent[] = [
  {
    id: "amd_btc_100k_2026q3",
    title: "비트코인이 2026년 3분기 안에 10만 달러를 돌파할까?",
    category: "코인",
    moment_of_truth: "2026-09-30T23:59:59+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_btc_100k_2026q3",
    status: "open",
    volume_krw: 184_500_000,
  },
  {
    id: "amd_eth_etf_inflow",
    title: "이더리움 현물 ETF 누적 자금 유입이 6월 말까지 50억 달러를 넘을까?",
    category: "코인",
    moment_of_truth: "2026-06-30T23:59:59+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_eth_etf_inflow",
    status: "open",
    volume_krw: 92_800_000,
  },
  {
    id: "amd_fomc_jun_rate",
    title: "6월 FOMC에서 미국 기준금리가 동결될까?",
    category: "경제",
    moment_of_truth: "2026-06-18T03:00:00+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_fomc_jun_rate",
    status: "open",
    volume_krw: 211_200_000,
  },
  {
    id: "amd_kor_export_jul",
    title: "7월 한국 수출이 전년 동월 대비 플러스를 기록할까?",
    category: "경제",
    moment_of_truth: "2026-08-01T09:00:00+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_kor_export_jul",
    status: "open",
    volume_krw: 38_700_000,
  },
  {
    id: "amd_nvda_q2_earnings",
    title: "엔비디아 2분기 매출이 컨센서스를 상회할까?",
    category: "기술",
    moment_of_truth: "2026-08-21T05:00:00+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_nvda_q2_earnings",
    status: "open",
    volume_krw: 67_300_000,
  },
  {
    id: "amd_ai_chip_market",
    title: "올해 AI 반도체 시장 규모가 5,000억 달러를 돌파할까?",
    category: "기술",
    moment_of_truth: "2026-12-31T23:59:59+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_ai_chip_market",
    status: "open",
    volume_krw: 105_900_000,
  },
  {
    id: "amd_kor_general_election",
    title: "내년 총선 여당이 과반 의석을 확보할까?",
    category: "정치",
    moment_of_truth: "2027-04-15T23:59:59+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_kor_general_election",
    status: "open",
    volume_krw: 59_400_000,
  },
  {
    id: "amd_us_midterm_senate",
    title: "미국 중간선거에서 민주당이 상원 다수당이 될까?",
    category: "정치",
    moment_of_truth: "2026-11-04T23:59:59+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_us_midterm_senate",
    status: "open",
    volume_krw: 88_100_000,
  },
  {
    id: "amd_son_top_scorer",
    title: "손흥민이 이번 시즌 EPL 득점왕에 오를까?",
    category: "스포츠",
    moment_of_truth: "2026-05-25T23:59:59+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_son_top_scorer",
    status: "closed",
    volume_krw: 41_200_000,
  },
  {
    id: "amd_kbo_champion",
    title: "올해 KBO 한국시리즈 우승팀은 LG 트윈스일까?",
    category: "스포츠",
    moment_of_truth: "2026-11-15T23:59:59+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_kbo_champion",
    status: "open",
    volume_krw: 32_600_000,
  },
  {
    id: "amd_kpop_album_million",
    title: "올해 K-POP 앨범 중 초동 100만 장을 돌파한 작품이 5장을 넘을까?",
    category: "연예",
    moment_of_truth: "2026-12-31T23:59:59+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_kpop_album_million",
    status: "open",
    volume_krw: 28_400_000,
  },
  {
    id: "amd_cannes_palme",
    title: "칸 영화제 황금종려상을 한국 영화가 수상할까?",
    category: "연예",
    moment_of_truth: "2026-05-24T23:59:59+09:00",
    thumbnail_url: null,
    detail_url: "https://playamado.com/events/amd_cannes_palme",
    status: "resolved",
    volume_krw: 18_900_000,
  },
];
