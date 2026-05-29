"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppRoute } from "@/helpers/types";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Eye,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export interface FeaturedItem {
  id: number;
  title: string;
  excerpt: string;
  thumbnail_url: string | null;
  category_name: string | null;
  views: number;
  upvotes: number;
  comment_count: number;
  action_url_1: string | null;
  action_url_1_label: string | null;
  action_url_2: string | null;
  action_url_2_label: string | null;
}

interface Props {
  topic_url: string;
  items: FeaturedItem[];
  showThumbnail?: boolean;
}

export const SpecialBoardFeaturedCarousel = ({
  topic_url,
  items,
  showThumbnail = true,
}: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: items.length > 1 });
  const [selected, setSelected] = useState(0);

  const scrollTo = useCallback(
    (idx: number) => emblaApi?.scrollTo(idx),
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {items.map((item) => (
            <div key={item.id} className="min-w-0 flex-[0_0_100%]">
              <FeaturedSlide
                item={item}
                topic_url={topic_url}
                showThumbnail={showThumbnail}
              />
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="이전"
            onClick={() => emblaApi?.scrollPrev()}
            // Sits outside the carousel viewport so it doesn't cover the slide
            // thumbnail. Solid background + shadow keeps it readable against
            // any slide content behind it.
            className="absolute -left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background shadow-md z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="다음"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute -right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background shadow-md z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex justify-center gap-1.5 mt-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번 슬라이드`}
                onClick={() => scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === selected ? "w-6 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const FeaturedSlide = ({
  item,
  topic_url,
  showThumbnail,
}: {
  item: FeaturedItem;
  topic_url: string;
  showThumbnail: boolean;
}) => {
  const detailHref = `${AppRoute.Threads}/${topic_url}/${item.id}`;
  return (
    <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40">
      <div
        className={`grid grid-cols-1 ${
          showThumbnail
            ? "sm:grid-cols-[180px_1fr_auto]"
            : "sm:grid-cols-[1fr_auto]"
        } gap-4 p-4 items-center`}
      >
        {showThumbnail && (
          <Link
            href={detailHref}
            className="relative block w-full sm:w-[180px] aspect-[16/10] rounded-md overflow-hidden bg-muted"
          >
            {item.thumbnail_url ? (
              <Image
                src={item.thumbnail_url}
                alt={item.title}
                fill
                sizes="180px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                이미지 없음
              </div>
            )}
            {item.category_name && (
              <Badge
                variant="secondary"
                className="absolute top-1.5 left-1.5 text-[11px]"
              >
                {item.category_name}
              </Badge>
            )}
          </Link>
        )}

        <div className="min-w-0">
          {!showThumbnail && item.category_name && (
            <Badge variant="secondary" className="text-[11px] mb-1 w-fit">
              {item.category_name}
            </Badge>
          )}
          <Link href={detailHref}>
            <h4 className="text-base sm:text-lg font-semibold leading-snug break-words line-clamp-2">
              {item.title}
            </h4>
          </Link>
          {item.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {item.excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {item.comment_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {item.views.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {item.upvotes.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:min-w-[160px]">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={detailHref}>토론 보러가기</Link>
          </Button>
          {item.action_url_1 && (
            <Button asChild size="sm" className="w-full">
              <a
                href={item.action_url_1}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.action_url_1_label || "바로가기"}
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
