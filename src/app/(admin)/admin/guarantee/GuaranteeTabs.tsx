"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AdminGuaranteeListForm from "./form";
import AdminGuaranteeBannerCard from "./banner";
import AdminGuaranteeRegionsCard from "./regions";

const TAB_VALUES = ["list", "settings"] as const;
type TabValue = (typeof TAB_VALUES)[number];
const DEFAULT_TAB: TabValue = "list";

function isTabValue(value: string | null): value is TabValue {
  return value !== null && (TAB_VALUES as readonly string[]).includes(value);
}

export default function GuaranteeTabs() {
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
      <TabsList className="grid w-full grid-cols-2 sm:w-auto">
        <TabsTrigger value="list">공식보증업체 목록</TabsTrigger>
        <TabsTrigger value="settings">설정</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="mt-4">
        <AdminGuaranteeListForm />
      </TabsContent>
      <TabsContent value="settings" className="mt-4 flex flex-col gap-4">
        <AdminGuaranteeBannerCard />
        <AdminGuaranteeRegionsCard />
      </TabsContent>
    </Tabs>
  );
}
