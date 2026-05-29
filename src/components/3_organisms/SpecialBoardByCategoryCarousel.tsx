"use client";

import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

interface Props {
  // One node per slot — caller renders CompactCard or CompactPlaceholder.
  slides: ReactNode[];
}

export const SpecialBoardByCategoryCarousel = ({ slides }: Props) => {
  // No autoplay; manual via the prev/next buttons. `align: "start"` snaps
  // slides from the left so the row feels paginated, not centered.
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sync();
    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    return () => {
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi, sync]);

  if (slides.length === 0) return null;

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((node, i) => (
            <div
              key={i}
              // `pr-3` simulates gap without breaking embla's slide-width
              // measurements. Visible-count responsive: 2 / 3 / 5.
              className="min-w-0 flex-[0_0_50%] sm:flex-[0_0_33.333%] lg:flex-[0_0_20%] pr-3 last:pr-0"
            >
              {node}
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="이전"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canPrev}
        className="absolute -left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-sm disabled:opacity-0 disabled:pointer-events-none transition-opacity"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="다음"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canNext}
        className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-sm disabled:opacity-0 disabled:pointer-events-none transition-opacity"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
