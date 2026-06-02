"use client";

import { useAdminTopicCategoriesHook } from "@/app/(admin)/admin/boards/topics/[topic]/categories/hook";
import { CategorySheet } from "@/app/(admin)/admin/boards/topics/[topic]/categories/CategorySheet";
import { FormProvider } from "react-hook-form";
import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { Button } from "@/components/ui/button";
import { DataTableSSR } from "@/components/2_molecules/Table/DataTableSSR";
import { use } from "react";

type Params = Promise<{ topic: string }>;

export default function BoardTopics(props: { params: Params }) {
  const params = use(props.params);

  const {
    columns,
    methods,
    topicsData,
    categoriesData,
    updatePagination,
    newCreateTopic,
    isHomeCardBoard,
    topic_id,
    sheetOpen,
    setSheetOpen,
    editingCategory,
    onCategorySaved,
  } = useAdminTopicCategoriesHook(Number(params.topic));
  return (
    <FormProvider {...methods}>
      <section className="w-full flex flex-col gap-4">
        <h2>{topicsData?.topics[0].name} 소분류</h2>
        {isHomeCardBoard && (
          <p className="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            메인 홈 카드형 게시판의 카테고리는 외부 소스에서 자동으로
            동기화되므로 직접 추가·수정·삭제할 수 없습니다.
          </p>
        )}
        <div className="w-full flex gap-2">
          <Input
            name="search"
            className="!w-fit"
            inputClassName="!w-[240px]"
            placeholder="이름/설명 검색"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updatePagination();
              }
            }}
          />
          <SelectInput
            name="order"
            items={[
              { value: "desc", label: "최신순" },
              { value: "asc", label: "과거순" },
            ]}
            buttonClassName="!w-fit"
          />
          <Button type="button" onClick={updatePagination} className="!w-fit">
            검색
          </Button>
          <Button
            type="button"
            onClick={newCreateTopic}
            className="!w-fit ml-4"
            disabled={isHomeCardBoard}
          >
            추가
          </Button>
        </div>
        <div className="w-full">
          <DataTableSSR
            data={categoriesData?.categories ?? []}
            columns={columns}
            setPageIndexAction={(index) => {
              methods.setValue("page", String(index));
              updatePagination();
            }}
            pagination={categoriesData?.pagination}
          />
        </div>
      </section>

      <CategorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        topicId={topic_id}
        category={editingCategory}
        onSaved={onCategorySaved}
      />
    </FormProvider>
  );
}
