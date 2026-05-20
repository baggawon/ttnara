import type { Metadata } from "next";

import { serverGet } from "@/helpers/server/get";
import { ApiRoute } from "@/helpers/types";
import type { SupportCachePayload } from "@/helpers/server/serverCache";

import SearchBar from "./_components/SearchBar";
import LinkCardsGrid from "./_components/LinkCardsGrid";
import QnaSection from "./_components/QnaSection";
import { buildPageTitle } from "@/helpers/server/brandSettings";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: await buildPageTitle("고객센터"),
});

const EMPTY: SupportCachePayload = {
  linkCards: [],
  categoriesWithQnas: [],
};

export default async function SupportPage() {
  const data =
    ((await serverGet(ApiRoute.supportRead)) as SupportCachePayload | null) ??
    EMPTY;

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-4 items-center">
        <h1 className="text-2xl sm:text-3xl font-bold">고객센터</h1>
        <p className="text-sm text-muted-foreground">
          궁금하신 사항을 검색해주세요
        </p>
        <SearchBar categories={data.categoriesWithQnas} />
      </header>

      {data.linkCards.length > 0 && <LinkCardsGrid cards={data.linkCards} />}

      <QnaSection categories={data.categoriesWithQnas} />
    </section>
  );
}
