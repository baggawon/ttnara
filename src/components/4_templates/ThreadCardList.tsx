"use client";

import type {
  ThreadListResponse,
  ThreadWithProfile,
} from "@/app/api/threads/read";
import type { TopicSettings } from "@/app/api/topic/read";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { threadsGet, topicSettingsGet } from "@/helpers/get";
import { AppRoute, QueryKey, type PaginationInfo } from "@/helpers/types";
import clsx from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

dayjs.extend(relativeTime);
dayjs.locale("ko");

const stripHtml = (raw: string | null | undefined, max = 100): string => {
  if (!raw) return "";
  const text = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
};

interface ThreadCardListProps {
  topic_url: string;
  category_name?: string;
  page?: number;
}

export const ThreadCardList = ({
  topic_url,
  category_name,
  page,
}: ThreadCardListProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = page && page > 0 ? page : 1;

  const { data: topicSettings } = useGetQuery<
    TopicSettings,
    { topic_url: string }
  >(
    {
      queryKey: [{ [QueryKey.topicSettings]: { topic_url } }],
      staleTime: Infinity,
    },
    topicSettingsGet,
    { topic_url },
    { silent: true }
  );

  const queryArgs = {
    topic_url,
    page: currentPage,
    ...(category_name ? { category_name } : {}),
  };

  const { data: listData } = useGetQuery<
    ThreadListResponse,
    { topic_url: string; page: number; category_name?: string }
  >(
    {
      queryKey: [{ [QueryKey.threads]: queryArgs }],
    },
    threadsGet,
    queryArgs,
    { silent: true }
  );

  const threads: ThreadWithProfile[] = listData?.threads ?? [];
  const categories = topicSettings?.categories ?? [];
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));
  const showThumbnail = topicSettings?.use_thumbnail ?? true;
  const pagination = listData?.pagination;

  const buildHref = (overrides: {
    page?: number | null;
    category?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (overrides.category === null) params.delete("category_name");
    else if (overrides.category !== undefined)
      params.set("category_name", overrides.category);
    if (overrides.page === null || overrides.page === 1) params.delete("page");
    else if (overrides.page !== undefined)
      params.set("page", String(overrides.page));
    const query = params.toString();
    return `${AppRoute.Threads}/${topic_url}${query ? `?${query}` : ""}`;
  };

  const handleCategoryChange = (next: string | null) => {
    // Category change resets to page 1.
    router.push(buildHref({ category: next, page: 1 }));
  };

  const goToPage = (next: number) => {
    router.push(buildHref({ page: next }));
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <CategoryTab
          active={!category_name}
          label="전체"
          onClick={() => handleCategoryChange(null)}
        />
        {categories.map((cat) => (
          <CategoryTab
            key={cat.id}
            active={category_name === cat.name}
            label={cat.name}
            onClick={() => handleCategoryChange(cat.name)}
          />
        ))}
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            등록된 게시글이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {threads.map((t) => (
            <ThreadCard
              key={t.id}
              thread={t}
              topic_url={topic_url}
              categoryName={
                t.category_id ? (categoryById.get(t.category_id) ?? null) : null
              }
              showThumbnail={showThumbnail}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <CardPagination
          pagination={pagination}
          navSize={topicSettings?.thread_page_nav_size ?? 5}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
};

const CategoryTab = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background text-foreground border-border hover:bg-muted"
    )}
  >
    {label}
  </button>
);

const ThreadCard = ({
  thread,
  topic_url,
  categoryName,
  showThumbnail,
}: {
  thread: ThreadWithProfile;
  topic_url: string;
  categoryName: string | null;
  showThumbnail: boolean;
}) => {
  const detailHref = `${AppRoute.Threads}/${topic_url}/${thread.id}`;
  // Prefer admin-authored description; fall back to a derived excerpt.
  const description = thread.description?.trim() || stripHtml(thread.content);
  const thumb = thread.images?.[0]?.aws_cloud_front_url ?? null;
  const action1 = thread.action_url_1?.trim();
  const action1Label = thread.action_url_1_label?.trim();

  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {showThumbnail && (
        <Link
          href={detailHref}
          className="relative block aspect-[16/9] bg-muted overflow-hidden"
        >
          {thumb ? (
            <Image
              src={thumb}
              alt={thread.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              이미지 없음
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {categoryName && (
              <Badge variant="secondary" className="text-[11px]">
                {categoryName}
              </Badge>
            )}
          </div>
          {thread.is_featured && (
            <Badge
              variant="default"
              className="absolute top-2 right-2 text-[11px] bg-rose-500 hover:bg-rose-500 text-white"
            >
              인기
            </Badge>
          )}
        </Link>
      )}

      <CardContent className="flex flex-col gap-2 p-4 flex-1">
        {!showThumbnail && (categoryName || thread.is_featured) && (
          <div className="flex items-center gap-1.5">
            {categoryName && (
              <Badge variant="secondary" className="text-[11px]">
                {categoryName}
              </Badge>
            )}
            {thread.is_featured && (
              <Badge
                variant="default"
                className="text-[11px] bg-rose-500 hover:bg-rose-500 text-white"
              >
                인기
              </Badge>
            )}
          </div>
        )}
        <Link href={detailHref} className="block">
          <h3 className="font-semibold text-base line-clamp-2 break-words leading-snug">
            {thread.title}
          </h3>
        </Link>
        {description && (
          <p className="hidden sm:line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
          <span>{dayjs(thread.created_at).fromNow()}</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {thread.comments?.length ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {thread.views}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" />
            {thread.upvotes}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={detailHref}>토론 보러가기</Link>
          </Button>
          {action1 && (
            <Button asChild size="sm" className="flex-1">
              <a href={action1} target="_blank" rel="noopener noreferrer">
                {action1Label || "바로가기"}
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CardPagination = ({
  pagination,
  navSize,
  onPageChange,
}: {
  pagination: PaginationInfo;
  navSize: number;
  onPageChange: (next: number) => void;
}) => {
  const { currentPage, totalPages, hasPreviousPage, hasNextPage } = pagination;
  // Window of page numbers centered around currentPage, clamped to bounds.
  const half = Math.floor(Math.max(navSize, 1) / 2);
  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + Math.max(navSize, 1) - 1);
  start = Math.max(1, end - Math.max(navSize, 1) + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasPreviousPage}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          type="button"
          variant={p === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(p)}
          className="min-w-[36px]"
        >
          {p}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasNextPage}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
