"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import LinkCardsTab from "./_components/LinkCardsTab";
import CategoriesTab from "./_components/CategoriesTab";
import QnaTab from "./_components/QnaTab";

const TAB_VALUES = ["link-cards", "categories", "qna"] as const;
type TabValue = (typeof TAB_VALUES)[number];
const DEFAULT_TAB: TabValue = "link-cards";

function isTabValue(value: string | null): value is TabValue {
  return value !== null && (TAB_VALUES as readonly string[]).includes(value);
}

export default function SupportTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : DEFAULT_TAB;

  const handleTabChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 sm:w-auto">
        <TabsTrigger value="link-cards">링크 카드</TabsTrigger>
        <TabsTrigger value="categories">QnA 카테고리</TabsTrigger>
        <TabsTrigger value="qna">QnA</TabsTrigger>
      </TabsList>

      <TabsContent value="link-cards" className="mt-4">
        <LinkCardsTab />
      </TabsContent>
      <TabsContent value="categories" className="mt-4">
        <CategoriesTab />
      </TabsContent>
      <TabsContent value="qna" className="mt-4">
        <QnaTab />
      </TabsContent>
    </Tabs>
  );
}
