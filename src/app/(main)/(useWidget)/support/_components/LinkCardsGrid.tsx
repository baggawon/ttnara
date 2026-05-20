import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { SupportCacheLinkCard } from "@/helpers/server/serverCache";

interface LinkCardsGridProps {
  cards: SupportCacheLinkCard[];
}

export default function LinkCardsGrid({ cards }: LinkCardsGridProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isExternal = /^https?:\/\//i.test(card.url);
        const linkProps = card.opens_in_new_tab
          ? { target: "_blank", rel: "noopener noreferrer" as const }
          : {};
        const content = (
          <article className="h-full flex flex-col items-center text-center gap-3 rounded-lg border bg-card p-5 hover:border-primary hover:shadow-sm transition">
            {card.cloudfront_url && (
              <Image
                src={card.cloudfront_url}
                alt=""
                width={48}
                height={48}
                unoptimized
                className="w-12 h-12 object-contain"
              />
            )}
            <div className="flex flex-col items-center gap-1 min-h-[3rem]">
              <h3 className="text-base font-semibold">{card.title}</h3>
              {card.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {card.description}
                </p>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-auto">
              바로가기
              <ArrowRight className="w-4 h-4" />
            </span>
          </article>
        );
        return (
          <li key={card.id}>
            {isExternal ? (
              <a href={card.url} {...linkProps} className="block h-full">
                {content}
              </a>
            ) : (
              <Link href={card.url} {...linkProps} className="block h-full">
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
