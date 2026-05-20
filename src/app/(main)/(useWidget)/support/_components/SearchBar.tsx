"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/components/lib/utils";
import type { SupportCacheCategory } from "@/helpers/server/serverCache";

interface SearchBarProps {
  categories: SupportCacheCategory[];
}

interface QnaSearchItem {
  id: number;
  question: string;
  categoryName: string;
}

const MAX_RESULTS = 8;

export default function SearchBar({ categories }: SearchBarProps) {
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = useMemo<QnaSearchItem[]>(
    () =>
      categories.flatMap((cat) =>
        cat.qnas.map((q) => ({
          id: q.id,
          question: q.question,
          categoryName: cat.name,
        }))
      ),
    [categories]
  );

  const results = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return [];
    return items
      .filter((item) => item.question.toLowerCase().includes(trimmed))
      .slice(0, MAX_RESULTS);
  }, [items, keyword]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [keyword]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToQna = (id: number) => {
    setKeyword("");
    setOpen(false);
    setActiveIndex(-1);
    const target = `#qna-${id}`;
    if (window.location.hash === target) {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else {
      window.location.hash = target;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const choice = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (choice) goToQna(choice.id);
    }
  };

  const showDropdown = open && keyword.trim().length > 0;

  return (
    <div ref={containerRef} className="w-full max-w-2xl relative">
      <div className="relative">
        <Input
          type="search"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="궁금하신 내용을 검색하세요"
          className="pl-4 pr-10 h-11"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        <Search
          className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>

      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goToQna(item.id);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition",
                      index === activeIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <span className="text-sm font-medium truncate">
                      {item.question}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.categoryName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
