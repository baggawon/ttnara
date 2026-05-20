"use client";

import { useAdminTopicsHook } from "@/app/(admin)/admin/boards/topics/hook";
import { FormProvider } from "react-hook-form";
import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { Button } from "@/components/ui/button";
import { DataTableSSR } from "@/components/2_molecules/Table/DataTableSSR";
import { TopicMobileList } from "./_components/TopicMobileList";

export default function BoardTopics() {
  const {
    columns,
    methods,
    topicsData,
    updatePagination,
    newCreateTopic,
    togglePreview,
    deleteTopic,
  } = useAdminTopicsHook();

  const handlePageChange = (index: number) => {
    methods.setValue("page", String(index));
    updatePagination();
  };

  return (
    <section className="w-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight">게시판 주제</h2>
      <FormProvider {...methods}>
        {/* Filters: wrap on mobile, single row on tablet+. */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] sm:max-w-[260px]">
            <Input
              name="search"
              className="w-full"
              inputClassName="w-full"
              placeholder="이름/URL 검색"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updatePagination();
                }
              }}
            />
          </div>
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
            className="!w-fit sm:ml-4"
          >
            추가
          </Button>
        </div>

        {/* Mobile / tablet: card list. Hidden on lg+. */}
        <TopicMobileList
          topics={topicsData?.topics}
          pagination={topicsData?.pagination}
          onPageChange={handlePageChange}
          onTogglePreview={togglePreview}
          onDelete={deleteTopic}
        />

        {/* Desktop: full DataTable. Hidden below lg. */}
        <div className="w-full hidden lg:block">
          <DataTableSSR
            data={topicsData?.topics ?? []}
            columns={columns}
            setPageIndexAction={handlePageChange}
            pagination={topicsData?.pagination}
          />
        </div>
      </FormProvider>
    </section>
  );
}
