import "server-only";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import type { category, thread } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";

// Recent-activity ranking weights. We score engagement from the last
// ACTIVITY_WINDOW_DAYS: each comment is a strong signal (× 5) and each net
// upvote stronger still per vote (× 3, since up/down both count toward intent).
// Views are a lifetime counter with no per-view log, so they can't be windowed
// — they're used only as a tiebreaker when the recent-activity score ties.
const COMMENT_WEIGHT = 5;
const VOTE_WEIGHT = 3;
const ACTIVITY_WINDOW_DAYS = 7;

export interface SpecialBoardCard {
  id: number;
  title: string;
  content_excerpt: string;
  thumbnail_url: string | null;
  category: { id: number; name: string } | null;
  created_at: Date;
  views: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  is_featured: boolean;
  action_url_1: string | null;
  action_url_1_label: string | null;
  action_url_2: string | null;
  action_url_2_label: string | null;
  activity_score: number;
  // Source Amado event has resolved/closed: removed from the live feed, or its
  // moment-of-truth date has passed. Surfaced as an "expired" marker on cards.
  expired: boolean;
}

export interface SpecialTopicInfo {
  id: number;
  name: string;
  url: string;
  level_read: number;
  use_thumbnail: boolean;
  use_upload_file: boolean;
  allowed_file_extensions: string;
  max_file_size_mb: number;
  max_upload_items: number;
  categories: Pick<category, "id" | "name">[];
}

export interface SpecialBoardHomeData {
  topic: SpecialTopicInfo;
  featured: SpecialBoardCard[];
  today: SpecialBoardCard[];
  // One entry per active topic category — `card` is null when the category
  // has no qualifying post yet, so the UI can render a placeholder slot.
  byCategory: {
    category: { id: number; name: string };
    card: SpecialBoardCard | null;
  }[];
}

// React `cache()` dedupes within a single request so layout + page reads share
// one DB hit. We deliberately skip `appCache` here so admin edits show up on
// the next request without depending on cross-module singleton state — same
// reasoning as `brandSettings.ts` / `homeVisibility.ts`.
export const getSpecialTopic = cache(
  async (): Promise<SpecialTopicInfo | null> => {
    const row = await handleConnect((prisma) =>
      prisma.topic.findFirst({
        where: { fullview_on_homepage: true, is_active: true },
        select: {
          id: true,
          name: true,
          url: true,
          level_read: true,
          use_thumbnail: true,
          use_upload_file: true,
          allowed_file_extensions: true,
          max_file_size_mb: true,
          max_upload_items: true,
          categories: {
            where: { is_active: true },
            select: { id: true, name: true },
            orderBy: { display_order: "asc" },
          },
        },
      })
    );
    return row ?? null;
  }
);

// Strip HTML/markdown to a short text excerpt for card UI. Keeps it simple —
// just collapse tags and whitespace, then truncate. Not exposed as content.
const buildExcerpt = (raw: string | null, max = 120): string => {
  if (!raw) return "";
  const stripped = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= max) return stripped;
  return stripped.slice(0, max).trimEnd() + "…";
};

type ThreadRow = thread & {
  category: { id: number; name: string } | null;
  _count: { comments: number };
};

const toCard = (
  t: ThreadRow,
  thumbnailMap: Map<number, string>,
  // Engagement from the last ACTIVITY_WINDOW_DAYS (comments + net votes); drives
  // home-widget ranking. Passed in (computed per-thread upstream); 0 for
  // featured cards where it's unused.
  activity_score: number
): SpecialBoardCard => {
  const comment_count = t._count.comments;
  // Prefer the admin-authored `description` when set; otherwise derive from
  // content as a fallback so older posts still get a readable preview.
  const description = (t.description?.trim() || buildExcerpt(t.content)) ?? "";
  const expired =
    t.amado_event_removed ||
    (t.amado_event_end_date != null &&
      t.amado_event_end_date.getTime() < Date.now());
  return {
    id: t.id,
    title: t.title,
    content_excerpt: description,
    thumbnail_url: thumbnailMap.get(t.id) ?? null,
    category: t.category,
    created_at: t.created_at,
    views: t.views,
    upvotes: t.upvotes,
    downvotes: t.downvotes,
    comment_count,
    is_featured: t.is_featured,
    action_url_1: t.action_url_1,
    action_url_1_label: t.action_url_1_label,
    action_url_2: t.action_url_2,
    action_url_2_label: t.action_url_2_label,
    activity_score,
    expired,
  };
};

const resolveThumbnails = async (
  threads: Pick<ThreadRow, "id" | "thumbnail_media_id">[]
): Promise<Map<number, string>> => {
  if (threads.length === 0) return new Map();
  const threadIds = threads.map((t) => t.id);
  const media = await handleConnect((prisma) =>
    prisma.media_upload.findMany({
      where: {
        attached_to_type: "thread",
        attached_to_id: { in: threadIds },
        media_type: "image",
      },
      select: { id: true, attached_to_id: true, aws_cloud_front_url: true },
      orderBy: { id: Prisma.SortOrder.asc },
    })
  );
  // Group each thread's images, preserving upload order (id asc) so the first
  // entry is the oldest upload — used as the fallback when no thumbnail is set.
  const byThread = new Map<number, { id: number; url: string }[]>();
  for (const m of media ?? []) {
    if (m.attached_to_id == null) continue;
    const list = byThread.get(m.attached_to_id) ?? [];
    list.push({ id: m.id, url: m.aws_cloud_front_url });
    byThread.set(m.attached_to_id, list);
  }
  const map = new Map<number, string>();
  for (const t of threads) {
    const candidates = byThread.get(t.id);
    if (!candidates || candidates.length === 0) continue;
    // Honor the author-selected thumbnail; fall back to the first upload.
    const chosen =
      (t.thumbnail_media_id != null &&
        candidates.find((c) => c.id === t.thumbnail_media_id)) ||
      candidates[0];
    map.set(t.id, signStoredCloudFrontUrl(chosen.url));
  }
  return map;
};

const threadCardSelect = {
  include: {
    category: { select: { id: true, name: true } },
    _count: { select: { comments: true } },
  },
} as const;

export const getSpecialBoardHomeData = cache(
  async (): Promise<SpecialBoardHomeData | null> => {
    const topic = await getSpecialTopic();
    if (!topic) return null;

    const since = new Date();
    since.setDate(since.getDate() - ACTIVITY_WINDOW_DAYS);

    const rows = await handleConnect((prisma) =>
      Promise.all([
        prisma.thread.findMany({
          where: {
            topic_id: topic.id,
            is_featured: true,
            is_blocked: false,
            is_secret: false,
          },
          orderBy: { created_at: "desc" },
          take: 10,
          ...threadCardSelect,
        }),
        // The full eligible pool — no creation-date filter, so an older post
        // that is currently active can still rank. Ordered newest-first and
        // capped at a generous ceiling for an admin-authored board.
        prisma.thread.findMany({
          where: {
            topic_id: topic.id,
            is_blocked: false,
            is_secret: false,
          },
          orderBy: { created_at: "desc" },
          take: 500,
          ...threadCardSelect,
        }),
      ])
    );
    if (!rows) return { topic, featured: [], today: [], byCategory: [] };
    const [featuredRows, poolRows] = rows;

    // Recent-engagement signals for ranking: comments and net votes from the
    // last ACTIVITY_WINDOW_DAYS, both timestamped at the event level. Grouped
    // in two queries (not per-thread) to avoid an N+1 over the pool.
    const poolIds = poolRows.map((t: ThreadRow) => t.id);
    const activity = poolIds.length
      ? await handleConnect((prisma) =>
          Promise.all([
            prisma.comment.groupBy({
              by: ["thread_id"],
              where: { thread_id: { in: poolIds }, created_at: { gte: since } },
              _count: { _all: true },
            }),
            prisma.thread_vote.groupBy({
              by: ["thread_id", "vote_type"],
              where: { thread_id: { in: poolIds }, created_at: { gte: since } },
              _count: { _all: true },
            }),
          ])
        )
      : undefined;
    const commentWindow = activity?.[0] ?? [];
    const voteWindow = activity?.[1] ?? [];

    const commentsIn7d = new Map<number, number>();
    for (const row of commentWindow) {
      commentsIn7d.set(row.thread_id, row._count._all);
    }
    const netVotesIn7d = new Map<number, number>();
    for (const row of voteWindow) {
      const delta = row.vote_type === "up" ? row._count._all : -row._count._all;
      netVotesIn7d.set(
        row.thread_id,
        (netVotesIn7d.get(row.thread_id) ?? 0) + delta
      );
    }
    const recentScore = (t: ThreadRow): number =>
      (commentsIn7d.get(t.id) ?? 0) * COMMENT_WEIGHT +
      (netVotesIn7d.get(t.id) ?? 0) * VOTE_WEIGHT;

    const uniqueThreads = Array.from(
      new Map(
        [...featuredRows, ...poolRows].map((t: ThreadRow) => [t.id, t])
      ).values()
    );
    const thumbnailMap = await resolveThumbnails(uniqueThreads);

    const featured = featuredRows.map((t: ThreadRow) =>
      toCard(t, thumbnailMap, recentScore(t))
    );
    // Rank by recent activity, then fall back through lifetime views and
    // finally recency, so ties — including the common all-zero-activity case —
    // still resolve to a stable, sensible order.
    const poolCards = poolRows
      .map((t: ThreadRow) => toCard(t, thumbnailMap, recentScore(t)))
      .sort((a: SpecialBoardCard, b: SpecialBoardCard) => {
        if (b.activity_score !== a.activity_score)
          return b.activity_score - a.activity_score;
        if (b.views !== a.views) return b.views - a.views;
        return b.created_at.getTime() - a.created_at.getTime();
      });

    const today = poolCards.slice(0, 3);

    // Always emit one slot per topic category so the section keeps a stable
    // shape on the home block — categories with no post at all get `card: null`
    // and render a placeholder client-side.
    const byCategory: SpecialBoardHomeData["byCategory"] = [];
    const seen = new Set<number>();
    for (const cat of topic.categories) {
      const top = poolCards.find(
        (c: SpecialBoardCard) => c.category?.id === cat.id && !seen.has(c.id)
      );
      if (top) seen.add(top.id);
      byCategory.push({ category: cat, card: top ?? null });
    }

    return { topic, featured, today, byCategory };
  }
);
