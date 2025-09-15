"use client";

import { useAdminRanksHook } from "./hook";
import { FormProvider } from "react-hook-form";
import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { Button } from "@/components/ui/button";
import { DataTableSSR } from "@/components/2_molecules/Table/DataTableSSR";
import RanksBatchEditForm from "./form";

export default function Ranks() {
  const {
    columns,
    methods,
    ranksData,
    updatePagination,
    newCreateRank,
    autoCreateRank,
    resetSearch,
  } = useAdminRanksHook();
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <h2>랭크 관리</h2>
      <FormProvider {...methods}>
        <div className="w-full flex gap-2">
          <Input
            name="search"
            className="!w-fit"
            inputClassName="!w-[240px]"
            placeholder="검색"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updatePagination();
              }
            }}
          />
          <SelectInput
            name="searchField"
            items={[
              { value: "name", label: "이름" },
              { value: "description", label: "설명" },
            ]}
          />
          <SelectInput
            name="order"
            items={[
              { value: "desc", label: "최신순" },
              { value: "asc", label: "과거순" },
            ]}
          />
          <Button type="button" onClick={updatePagination}>
            검색
          </Button>
          <Button type="button" variant="outline" onClick={resetSearch}>
            초기화
          </Button>
          <RanksBatchEditForm />
          <Button type="button" onClick={newCreateRank}>
            생성
          </Button>
          <Button type="button" onClick={autoCreateRank}>
            자동 생성
          </Button>
        </div>
        <div className="w-full">
          <DataTableSSR
            columns={columns}
            data={ranksData?.ranks ?? []}
            setPageIndexAction={(index) => {
              methods.setValue("page", String(index));
              updatePagination();
            }}
            pagination={ranksData?.pagination}
          />
        </div>
      </FormProvider>
    </section>
  );
}
