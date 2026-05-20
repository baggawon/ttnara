"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import HTMLViewer from "@/components/1_atoms/HTMLViewer";
import { cn } from "@/components/lib/utils";

import type { SupportCacheCategory } from "@/helpers/server/serverCache";

interface QnaSectionProps {
  categories: SupportCacheCategory[];
}

const ALL_TAB = "__all__";

export default function QnaSection({ categories }: QnaSectionProps) {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [openItem, setOpenItem] = useState<string>("");
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const pendingScrollRef = useRef<number | null>(null);

  const allQnas = useMemo(
    () =>
      categories.flatMap((cat) =>
        cat.qnas.map((q) => ({ ...q, categoryName: cat.name }))
      ),
    [categories]
  );

  const visibleQnas = useMemo(() => {
    if (activeTab === ALL_TAB) return allQnas;
    const cat = categories.find((c) => String(c.id) === activeTab);
    if (!cat) return [];
    return cat.qnas.map((q) => ({ ...q, categoryName: cat.name }));
  }, [activeTab, allQnas, categories]);

  // Jump to a specific QnA: force the "전체" tab so the item is in the DOM,
  // open its accordion panel, flag it for scroll + highlight.
  const focusQna = useCallback(
    (id: number) => {
      const exists = categories.some((c) => c.qnas.some((q) => q.id === id));
      if (!exists) return;
      setActiveTab(ALL_TAB);
      setOpenItem(String(id));
      setHighlightId(id);
      pendingScrollRef.current = id;
    },
    [categories]
  );

  useEffect(() => {
    const parseHash = () => {
      const match = window.location.hash.match(/^#qna-(\d+)$/);
      if (match) focusQna(Number(match[1]));
    };
    parseHash();
    window.addEventListener("hashchange", parseHash);
    return () => window.removeEventListener("hashchange", parseHash);
  }, [focusQna]);

  useEffect(() => {
    if (pendingScrollRef.current === null) return;
    const id = pendingScrollRef.current;
    pendingScrollRef.current = null;
    document
      .getElementById(`qna-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  useEffect(() => {
    if (highlightId === null) return;
    const timer = setTimeout(() => setHighlightId(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightId]);

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        등록된 QnA가 없습니다.
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 border-b pb-2">
        <TabButton
          label="전체"
          isActive={activeTab === ALL_TAB}
          onClick={() => setActiveTab(ALL_TAB)}
        />
        {categories.map((cat) => (
          <TabButton
            key={cat.id}
            label={cat.name}
            isActive={activeTab === String(cat.id)}
            onClick={() => setActiveTab(String(cat.id))}
          />
        ))}
      </div>

      {visibleQnas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          해당 카테고리에 등록된 QnA가 없습니다.
        </p>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={openItem}
          onValueChange={setOpenItem}
          className="flex flex-col gap-2"
        >
          {visibleQnas.map((qna) => (
            <AccordionItem
              key={qna.id}
              id={`qna-${qna.id}`}
              value={String(qna.id)}
              className={cn(
                "rounded-md border bg-card scroll-mt-24 transition-colors data-[state=open]:border-primary",
                highlightId === qna.id && "border-primary ring-2 ring-primary"
              )}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left min-w-0">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    Q
                  </span>
                  <span className="text-sm sm:text-base font-medium truncate">
                    {qna.question}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <HTMLViewer
                  htmlContent={qna.answer ?? ""}
                  format={(qna.content_format as "html" | "markdown") ?? "html"}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </section>
  );
}

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm font-medium transition",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
