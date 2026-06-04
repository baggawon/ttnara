"use client";

import { useAdminBoardRanksHook } from "./hook";
import { FormProvider } from "react-hook-form";
import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { Button } from "@/components/ui/button";
import { DataTableSSR } from "@/components/2_molecules/Table/DataTableSSR";
import BoardRankCreateSheet from "./BoardRankCreateSheet";
import BoardRankEditSheet from "./BoardRankEditSheet";
import { BoardRankMobileList } from "./_components/BoardRankMobileList";
import { useRouter } from "next/navigation";
import { AdminAppRoute } from "@/helpers/types";
import { ImagePlus } from "lucide-react";

export default function BoardRanks() {
  const router = useRouter();
  const {
    columns,
    methods,
    ranksData,
    updatePagination,
    autoCreateRank,
    deleteRank,
    resetSearch,
    editRankId,
    setEditRankId,
  } = useAdminBoardRanksHook();

  const handlePageChange = (index: number) => {
    methods.setValue("page", String(index));
    updatePagination();
  };

  return (
    <section className="w-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight">게시판 등급 관리</h2>
      <FormProvider {...methods}>
        {/* Filters: wrap on mobile, single row on tablet+. */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] sm:max-w-[260px]">
            <Input
              name="search"
              className="w-full"
              inputClassName="w-full"
              placeholder="검색"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updatePagination();
                }
              }}
            />
          </div>
          <SelectInput
            name="searchField"
            items={[
              { value: "name", label: "이름" },
              { value: "description", label: "설명" },
            ]}
            buttonClassName="!w-fit"
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
            variant="outline"
            onClick={resetSearch}
            className="!w-fit"
          >
            초기화
          </Button>
        </div>

        {/* Action row — separate so it wraps independently on tighter screens. */}
        <div className="flex flex-wrap items-center gap-2">
          <BoardRankCreateSheet />
          <Button type="button" onClick={autoCreateRank} className="!w-fit">
            등급 자동 생성
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(AdminAppRoute.BoardRankBadges)}
            className="!w-fit"
          >
            <ImagePlus className="w-4 h-4 mr-1" />
            배지 이미지 관리
          </Button>
        </div>

        {/* Mobile / tablet: card list. Hidden on lg+. */}
        <BoardRankMobileList
          ranks={ranksData?.ranks}
          pagination={ranksData?.pagination}
          onPageChange={handlePageChange}
          onDelete={deleteRank}
          onEdit={setEditRankId}
        />

        {/* Desktop: full DataTable. Hidden below lg. */}
        <div className="w-full hidden lg:block">
          <DataTableSSR
            columns={columns}
            data={ranksData?.ranks ?? []}
            setPageIndexAction={handlePageChange}
            pagination={ranksData?.pagination}
          />
        </div>

        <BoardRankEditSheet
          rankId={editRankId}
          onClose={() => setEditRankId(null)}
        />
      </FormProvider>
    </section>
  );
}
