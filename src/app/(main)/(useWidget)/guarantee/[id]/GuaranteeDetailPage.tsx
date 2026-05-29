"use client";

import { Button } from "@/components/ui/button";
import HTMLViewer, {
  type ContentFormat,
} from "@/components/1_atoms/HTMLViewer";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { publicGuaranteeGet } from "@/helpers/get";
import { AppRoute, GuaranteePositionLabel, QueryKey } from "@/helpers/types";
import type { GuaranteePosition } from "@/helpers/types";
import type { PublicGuaranteeResponse } from "@/app/api/guarantee/list";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GuaranteeHeroBanner } from "../GuaranteeHeroBanner";

interface Props {
  id: number;
}

export default function GuaranteeDetailPage({ id }: Props) {
  const { data, status } = useGetQuery<PublicGuaranteeResponse, undefined>(
    { queryKey: [QueryKey.guaranteeCompanies, "public"] },
    publicGuaranteeGet,
    undefined,
    { silent: true }
  );

  const item = data?.items.find((i) => i.id === id);

  const infoRef = useRef<HTMLDivElement>(null);
  const [infoHeight, setInfoHeight] = useState<number>();

  useEffect(() => {
    const el = infoRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setInfoHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [item]);

  if (status === "pending") {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500 py-12">
          공식보증업체를 찾을 수 없습니다.
        </div>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href={AppRoute.Guarantee}>
              <ChevronLeft size={16} className="mr-1" />
              목록으로
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-6 md:py-8">
      <GuaranteeHeroBanner src={data?.public_hero_image_url} />

      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={AppRoute.Guarantee}>
              <ChevronLeft size={16} className="mr-1" />
              목록으로
            </Link>
          </Button>
        </div>

        <h2 className="text-xl md:text-2xl font-bold mb-6">{item.title}</h2>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {item.public_image_url && (
            <div
              className="relative w-full aspect-square md:aspect-auto md:w-[var(--img-size)] md:h-[var(--img-size)] bg-muted rounded-lg overflow-hidden md:shrink-0"
              style={
                {
                  "--img-size": infoHeight ? `${infoHeight}px` : "288px",
                } as CSSProperties
              }
            >
              <Image
                src={item.public_image_url}
                alt={item.business_name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <div
            ref={infoRef}
            className="flex flex-col gap-4 flex-1 min-w-0 w-full"
          >
            <dl className="border rounded-lg divide-y overflow-hidden">
              <Row label="업 체 명" value={item.business_name} />
              <Row
                label="연 락 처"
                value={
                  <a
                    href={item.telegram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {item.telegram_url.replace(/^https?:\/\//, "")}
                    <ExternalLink size={12} />
                  </a>
                }
              />
              <Row label="지 역" value={(item.regions ?? []).join(", ")} />
              <Row
                label="거래"
                value={(item.positions ?? [])
                  .map(
                    (p) => GuaranteePositionLabel[p as GuaranteePosition] ?? p
                  )
                  .join(" / ")}
              />
              <Row label="취 급" value={(item.currencies ?? []).join(" / ")} />
              <Row label="보 증 금" value={item.deposit} />
            </dl>

            {item.url && !item.no_website && (
              <Button asChild size="lg">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2"
                >
                  바로가기 <ExternalLink size={16} />
                </a>
              </Button>
            )}
          </div>
        </div>

        {item.description?.trim() && (
          <section className="mt-8 border rounded-lg overflow-hidden">
            <h3 className="bg-muted/60 px-4 py-3 text-sm font-semibold border-b">
              상세설명
            </h3>
            <HTMLViewer
              htmlContent={item.description}
              format={(item.description_format as ContentFormat) ?? "html"}
              className="!py-4 !px-4"
            />
          </section>
        )}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center">
      <div className="bg-muted/60 px-4 py-3 text-sm font-semibold">{label}</div>
      <div className="px-4 py-3 text-sm">{value}</div>
    </div>
  );
}
