import "server-only";
import type { AmadoEvent } from "@/helpers/server/amado/mockEvents";

// playamado.com is a client-rendered SPA backed by an AWS Lambda Function URL
// (Seoul / ap-northeast-2). Public reads need no auth — only an `x-lang`
// header. Override the base via env so a future subscription API can be
// swapped in without code changes.
const AMADO_API_BASE = (
  process.env.AMADO_API_BASE ??
  "https://slfuvmwvijcvfjemu7prs6lwu40pebry.lambda-url.ap-northeast-2.on.aws"
).replace(/\/$/, "");

const CACHE_TTL_MS = Number(process.env.AMADO_CACHE_TTL_MS ?? 60 * 60 * 1000);
const REQUEST_TIMEOUT_MS = 10_000;
const MARKETS_PAGE_LIMIT = 100;
// Safety bound on cursor paging — ~2-3 pages cover the full event list today.
const MARKETS_MAX_PAGES = 10;

// --- Raw upstream shapes (what the Amado Lambda returns) ---
interface RawAmadoEvent {
  id: string;
  title?: string;
  titleI18n?: Record<string, string>;
  imageUrl?: string | null;
  visible?: string; // "Y" | "N"
  taxonIds?: string[];
  displayStatus?: string; // "OPEN" | "CLOSED" | "RESOLVED" | ...
}

interface RawTaxon {
  id: string;
  name: string;
  isDeleted?: boolean;
}

interface RawMarket {
  id: string;
  eventId: string;
  settlementAt?: string | null;
  tradingEndDate?: string | null;
  totalVolume?: number | null;
}

interface MarketsPage {
  items?: RawMarket[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

const amadoFetch = async <T>(path: string): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${AMADO_API_BASE}/${path.replace(/^\//, "")}`, {
      headers: { "x-lang": "ko", "Content-Type": "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Amado ${path} → HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
};

// Markets paginate by cursor; group them by their parent event so each event
// can be enriched with a resolution date + traded volume.
const fetchMarketsByEvent = async (): Promise<Map<string, RawMarket[]>> => {
  const byEvent = new Map<string, RawMarket[]>();
  let cursor: string | null = null;
  for (let page = 0; page < MARKETS_MAX_PAGES; page++) {
    const qs = new URLSearchParams({ limit: String(MARKETS_PAGE_LIMIT) });
    if (cursor) qs.set("cursor", cursor);
    const data = await amadoFetch<MarketsPage>(`markets?${qs.toString()}`);
    for (const m of data.items ?? []) {
      if (!m.eventId) continue;
      const arr = byEvent.get(m.eventId) ?? [];
      arr.push(m);
      byEvent.set(m.eventId, arr);
    }
    if (!data.hasMore || !data.nextCursor) break;
    cursor = data.nextCursor;
  }
  return byEvent;
};

const mapStatus = (raw: string | undefined): AmadoEvent["status"] => {
  switch ((raw ?? "").toUpperCase()) {
    case "CLOSED":
      return "closed";
    case "RESOLVED":
    case "SETTLED":
      return "resolved";
    default:
      return "open";
  }
};

// The event's "moment of truth" is when its last market settles; volume is the
// sum across its markets. ISO-8601 UTC strings compare correctly lexically.
const aggregateMarkets = (
  markets: RawMarket[] | undefined
): Pick<AmadoEvent, "moment_of_truth" | "volume_krw"> => {
  if (!markets || markets.length === 0) {
    return { moment_of_truth: null, volume_krw: null };
  }
  let latest: string | null = null;
  let volume = 0;
  let hasVolume = false;
  for (const m of markets) {
    const at = m.settlementAt ?? m.tradingEndDate ?? null;
    if (at && (!latest || at > latest)) latest = at;
    if (typeof m.totalVolume === "number") {
      volume += m.totalVolume;
      hasVolume = true;
    }
  }
  return { moment_of_truth: latest, volume_krw: hasVolume ? volume : null };
};

const buildEvents = async (): Promise<AmadoEvent[]> => {
  const [rawEvents, rawTaxons, marketsByEvent] = await Promise.all([
    amadoFetch<RawAmadoEvent[]>("markets/events"),
    amadoFetch<RawTaxon[]>("markets/taxons"),
    fetchMarketsByEvent(),
  ]);

  const taxonName = new Map<string, string>();
  for (const t of rawTaxons ?? []) {
    if (t.isDeleted) continue;
    taxonName.set(t.id, t.name);
  }

  return (rawEvents ?? [])
    .filter((e) => (e.visible ?? "Y") !== "N")
    .map((e) => {
      const category =
        (e.taxonIds ?? [])
          .map((id) => taxonName.get(id))
          .find((n): n is string => !!n) ?? "기타";
      return {
        id: e.id,
        title: e.title ?? e.titleI18n?.ko ?? "",
        category,
        thumbnail_url: e.imageUrl ?? null,
        detail_url: `https://playamado.com/events/${e.id}`,
        status: mapStatus(e.displayStatus),
        ...aggregateMarkets(marketsByEvent.get(e.id)),
      } satisfies AmadoEvent;
    });
};

interface CacheEntry {
  data: AmadoEvent[];
  fetchedAt: number;
}
let cache: CacheEntry | null = null;
let inflight: Promise<AmadoEvent[]> | null = null;

// Live event list, cached in-process for ~1h. Concurrent callers share one
// refresh; a transient upstream failure serves the last-good snapshot rather
// than throwing (the caller falls back to the bundled mock only on a cold miss).
export const getAmadoEvents = async (): Promise<AmadoEvent[]> => {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await buildEvents();
      cache = { data, fetchedAt: Date.now() };
      return data;
    } catch (err) {
      if (cache) return cache.data;
      throw err;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
};
