"use client";

import { useAdminTopicsHook } from "@/app/(admin)/admin/boards/topics/hook";
import { FormProvider } from "react-hook-form";
import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { Button } from "@/components/ui/button";
import { DataTableSSR } from "@/components/2_molecules/Table/DataTableSSR";

export default function BoardTopics() {
  const { columns, methods, topicsData, updatePagination, newCreateTopic } =
    useAdminTopicsHook();
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <h2>게시판 주제</h2>
      <FormProvider {...methods}>
        <div className="w-full flex gap-2">
          <Input
            name="search"
            className="!w-fit"
            inputClassName="!w-[240px]"
            placeholder="이름/URL 검색"
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
          >
            추가
          </Button>
        </div>
        <div className="w-full">
          <DataTableSSR
            data={topicsData?.topics ?? []}
            columns={columns}
            setPageIndexAction={(index) => {
              methods.setValue("page", String(index));
              updatePagination();
            }}
            pagination={topicsData?.pagination}
          />
        </div>
      </FormProvider>
    </section>
  );
}
