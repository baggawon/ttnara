"use client";

import { cn } from "@/components/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { publicGuaranteeGet } from "@/helpers/get";
import { AppRoute, GuaranteePositionLabel, QueryKey } from "@/helpers/types";
import type { GuaranteePosition } from "@/helpers/types";
import type { PublicGuaranteeResponse } from "@/app/api/guarantee/list";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Send } from "lucide-react";
import { GuaranteeHeroBanner } from "./GuaranteeHeroBanner";

const ALL = "전체";

export default function GuaranteeListPage() {
  const { data, status } = useGetQuery<PublicGuaranteeResponse, undefined>(
    { queryKey: [QueryKey.guaranteeCompanies, "public"] },
    publicGuaranteeGet
  );

  const [selectedRegion, setSelectedRegion] = useState<string>(ALL);

  const regionNames = useMemo(
    () => (data?.regions ?? []).map((r) => r.name),
    [data?.regions]
  );

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    if (selectedRegion === ALL) return items;
    return items.filter((i) => (i.regions ?? []).includes(selectedRegion));
  }, [data?.items, selectedRegion]);

  return (
    <section className="container mx-auto px-4 py-6 md:py-8">
      <GuaranteeHeroBanner src={data?.public_hero_image_url} />

      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
        공식보증업체
      </h1>

      <div className="flex flex-wrap justify-center gap-2 mb-6 border-b pb-4">
        {[ALL, ...regionNames].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setSelectedRegion(r)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm transition-colors noto-sans-kr",
              selectedRegion === r
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {status === "pending" ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-pulse text-gray-500">로딩 중...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          등록된 공식보증업체가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col rounded-lg border shadow-sm overflow-hidden bg-card"
            >
              {item.public_image_url && (
                <div className="relative w-full aspect-square bg-muted">
                  <Image
                    src={item.public_image_url}
                    alt={item.business_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="p-4 flex-1 min-w-0 flex flex-col gap-3">
                <h3 className="font-semibold truncate">{item.business_name}</h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm items-center">
                  <dt className="text-muted-foreground self-start">활동지역</dt>
                  <dd className="min-w-0">
                    {(() => {
                      const regions = item.regions ?? [];
                      if (regions.length === 0) return "-";
                      const shown = regions.slice(0, 2);
                      const rest = regions.slice(2);
                      return (
                        <div className="flex flex-wrap items-center gap-1">
                          {shown.map((r) => (
                            <span
                              key={r}
                              className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap"
                            >
                              {r}
                            </span>
                          ))}
                          {rest.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary whitespace-nowrap hover:bg-primary/20 transition-colors"
                                >
                                  외 {rest.length} 지역
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="start"
                                className="w-auto max-w-[260px] p-3"
                              >
                                <div className="flex flex-wrap gap-1">
                                  {regions.map((r) => (
                                    <span
                                      key={r}
                                      className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap"
                                    >
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      );
                    })()}
                  </dd>
                  <dt className="text-muted-foreground">취급</dt>
                  <dd className="truncate">
                    {(item.currencies ?? []).join(" / ")}
                  </dd>
                  <dt className="text-muted-foreground">거래</dt>
                  <dd>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                      {(item.positions ?? [])
                        .map(
                          (p) =>
                            GuaranteePositionLabel[p as GuaranteePosition] ?? p
                        )
                        .join(" / ")}
                    </span>
                  </dd>
                </dl>
                <div className="flex flex-col md:flex-row gap-2 mt-auto pt-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`${AppRoute.Guarantee}/${item.id}`}>
                      상세보기
                    </Link>
                  </Button>
                  {item.telegram_url && (
                    <Button asChild className="flex-1">
                      <a
                        href={item.telegram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1"
                      >
                        바로가기 <Send size={14} />
                      </a>
                    </Button>
                  )}
                  {item.url && !item.no_website && (
                    <Button asChild className="flex-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1"
                      >
                        바로가기 <ExternalLink size={14} />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
