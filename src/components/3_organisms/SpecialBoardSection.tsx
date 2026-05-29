import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getSpecialBoardHomeData,
  type SpecialBoardCard,
} from "@/helpers/server/specialBoard";
import { AppRoute } from "@/helpers/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { ChevronRight, Eye, Lock, MessageSquare, ThumbsUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SpecialBoardFeaturedCarousel } from "@/components/3_organisms/SpecialBoardFeaturedCarousel";
import { SpecialBoardByCategoryCarousel } from "@/components/3_organisms/SpecialBoardByCategoryCarousel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";

dayjs.extend(relativeTime);
dayjs.locale("ko");

export const SpecialBoardSection = async () => {
  const data = await getSpecialBoardHomeData();
  if (!data) return null;

  const { topic, featured, today, byCategory } = data;
  const boardHref = `${AppRoute.Threads}/${topic.url}`;
  const showThumbnail = topic.use_thumbnail;

  const session = await getServerSession(authOptions);
  const viewerAuthLevel = session?.user?.auth_level ?? 0;
  const isAppAdmin = session?.user?.is_app_admin ?? false;
  const canRead = isAppAdmin || viewerAuthLevel >= topic.level_read;

  if (!canRead) {
    return (
      <section className="w-full">
        <SectionBlock title={topic.name}>
          <Card>
            <CardContent className="min-h-[120px] flex flex-col items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Lock className="h-5 w-5" />
              <span>
                이 게시판을 보려면 등급 {topic.level_read} 이상이 필요합니다.
              </span>
            </CardContent>
          </Card>
        </SectionBlock>
      </section>
    );
  }

  return (
    <section className="w-full flex flex-col gap-6">
      <SectionBlock
        title="운영자 PICK"
        icon={
          <span aria-hidden className="text-amber-500">
            ★
          </span>
        }
      >
        {featured.length > 0 ? (
          <SpecialBoardFeaturedCarousel
            topic_url={topic.url}
            showThumbnail={showThumbnail}
            items={featured.map((f) => ({
              id: f.id,
              title: f.title,
              excerpt: f.content_excerpt,
              thumbnail_url: f.thumbnail_url,
              category_name: f.category?.name ?? null,
              views: f.views,
              upvotes: f.upvotes,
              comment_count: f.comment_count,
              action_url_1: f.action_url_1,
              action_url_1_label: f.action_url_1_label,
              action_url_2: f.action_url_2,
              action_url_2_label: f.action_url_2_label,
              expired: f.expired,
            }))}
          />
        ) : (
          <EmptyPlaceholder
            label="아직 등록된 PICK 게시글이 없습니다."
            height="min-h-[140px]"
          />
        )}
      </SectionBlock>

      <SectionBlock title="오늘의 주요 토론" moreHref={boardHref}>
        {today.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {today.map((card) => (
              <TodayCard
                key={card.id}
                card={card}
                topic_url={topic.url}
                showThumbnail={showThumbnail}
              />
            ))}
          </div>
        ) : (
          <EmptyPlaceholder label="최근 7일간 등록된 게시글이 없습니다." />
        )}
      </SectionBlock>

      <SectionBlock title="카테고리별 인기 주제" moreHref={boardHref}>
        {byCategory.length > 0 ? (
          <SpecialBoardByCategoryCarousel
            slides={byCategory.map(({ category, card }) =>
              card ? (
                <CompactCard
                  key={category.id}
                  card={card}
                  category_name={category.name}
                  topic_url={topic.url}
                  showThumbnail={showThumbnail}
                />
              ) : (
                <CompactPlaceholder
                  key={category.id}
                  category_name={category.name}
                  showThumbnail={showThumbnail}
                />
              )
            )}
          />
        ) : (
          <EmptyPlaceholder label="등록된 카테고리가 없습니다." />
        )}
      </SectionBlock>
    </section>
  );
};

const EmptyPlaceholder = ({
  label,
  height = "min-h-[100px]",
}: {
  label: string;
  height?: string;
}) => (
  <Card>
    <CardContent
      className={`${height} flex items-center justify-center text-sm text-muted-foreground py-6`}
    >
      {label}
    </CardContent>
  </Card>
);

const SectionBlock = ({
  title,
  moreHref,
  icon,
  children,
}: {
  title: string;
  moreHref?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-base font-semibold inline-flex items-center gap-1">
        {title}
        {icon}
      </h3>
      {moreHref && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
        >
          <Link href={moreHref} className="inline-flex items-center gap-0.5">
            더보기
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
    {children}
  </div>
);

const TodayCard = ({
  card,
  topic_url,
  showThumbnail,
}: {
  card: SpecialBoardCard;
  topic_url: string;
  showThumbnail: boolean;
}) => {
  const detailHref = `${AppRoute.Threads}/${topic_url}/${card.id}`;
  const action1 = card.action_url_1?.trim();
  const action1Label = card.action_url_1_label?.trim();

  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {showThumbnail && (
        <Link
          href={detailHref}
          className="relative block aspect-[16/9] bg-muted overflow-hidden"
        >
          {card.thumbnail_url ? (
            <Image
              src={card.thumbnail_url}
              alt={card.title}
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
            {card.category?.name && (
              <Badge variant="secondary" className="text-[11px]">
                {card.category.name}
              </Badge>
            )}
          </div>
        </Link>
      )}
      <CardContent className="flex flex-col gap-2 p-4 flex-1">
        {!showThumbnail && card.category?.name && (
          <Badge variant="secondary" className="text-[11px] w-fit">
            {card.category.name}
          </Badge>
        )}
        <Link href={detailHref}>
          <h4 className="font-semibold text-base line-clamp-2 break-words leading-snug">
            {card.title}
          </h4>
        </Link>
        {card.content_excerpt && (
          <p className="hidden sm:line-clamp-2 text-sm text-muted-foreground">
            {card.content_excerpt}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
          {card.expired && (
            <span className="font-medium text-rose-500">만료</span>
          )}
          <span>{dayjs(card.created_at).fromNow()}</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {card.comment_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {card.views.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" />
            {card.upvotes.toLocaleString()}
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

const CompactCard = ({
  card,
  category_name,
  topic_url,
  showThumbnail,
}: {
  card: SpecialBoardCard;
  category_name: string;
  topic_url: string;
  showThumbnail: boolean;
}) => {
  const detailHref = `${AppRoute.Threads}/${topic_url}/${card.id}`;
  return (
    <Link href={detailHref} className="block h-full">
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        {showThumbnail && (
          <div className="relative aspect-[16/9] bg-muted">
            {card.thumbnail_url ? (
              <Image
                src={card.thumbnail_url}
                alt={card.title}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                이미지 없음
              </div>
            )}
            <Badge
              variant="secondary"
              className="absolute top-1.5 left-1.5 text-[10px]"
            >
              {category_name}
            </Badge>
          </div>
        )}
        <CardContent className="p-2.5">
          {!showThumbnail && (
            <Badge variant="secondary" className="text-[10px] w-fit mb-1">
              {category_name}
            </Badge>
          )}
          <h4 className="text-xs font-medium line-clamp-2 leading-snug break-words min-h-[2.1rem]">
            {card.title}
          </h4>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1.5">
            {card.expired && (
              <span className="font-medium text-rose-500">만료</span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {card.comment_count}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <ThumbsUp className="h-3 w-3" />
              {card.upvotes.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

// Renders an empty slot for a category that has no qualifying post yet so the
// row stays full-width and users can anticipate where future content will
// appear. Unclickable since there's nothing to navigate to.
const CompactPlaceholder = ({
  category_name,
  showThumbnail,
}: {
  category_name: string;
  showThumbnail: boolean;
}) => (
  <Card className="overflow-hidden border-dashed opacity-70 h-full">
    {showThumbnail && (
      <div className="relative aspect-[16/9] bg-muted/40 flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground">
          곧 업데이트됩니다
        </span>
        <Badge
          variant="secondary"
          className="absolute top-1.5 left-1.5 text-[10px]"
        >
          {category_name}
        </Badge>
      </div>
    )}
    <CardContent className="p-2.5">
      {!showThumbnail && (
        <Badge variant="secondary" className="text-[10px] w-fit mb-1">
          {category_name}
        </Badge>
      )}
      <h4 className="text-xs font-medium leading-snug break-words text-muted-foreground line-clamp-2 min-h-[2.1rem]">
        등록된 게시글이 없습니다
      </h4>
      <div className="text-[10px] text-muted-foreground mt-1.5">
        곧 업데이트됩니다
      </div>
    </CardContent>
  </Card>
);
