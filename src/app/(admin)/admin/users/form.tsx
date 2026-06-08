"use client";

import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { DataTableSSR } from "@/components/2_molecules/Table/DataTableSSR";
import { Button } from "@/components/ui/button";
import { map } from "@/helpers/basic";
import { FormProvider } from "react-hook-form";

import { useAdminUsersListHook } from "./hook";
import { UserMobileList } from "./_components/UserMobileList";

function getKycStatus(kyc_id: string | null | undefined, lang?: string) {
  if (kyc_id === null || kyc_id === undefined) {
    return lang === "ko" ? "미등록" : "Unregistered";
  }

  const numericValue = Number(kyc_id);
  if (isNaN(numericValue)) {
    return lang === "ko" ? "미등록" : "Unregistered";
  }

  if (numericValue === 0) {
    return lang === "ko" ? "시뮬레이션 인증" : "Simulation";
  }

  if (numericValue > 0) {
    return lang === "ko" ? "인증완료" : "Verified";
  }

  return lang === "ko" ? "미등록" : "Unregistered";
}

export default function AdminUsersListForm() {
  const { columns, methods, levelData, usersData, updatePagination } =
    useAdminUsersListHook();

  return (
    <FormProvider {...methods}>
      <h2 className="text-2xl font-bold tracking-tight">사용자</h2>

      {/* Filters: stack on mobile, row on tablet+. The wrap + min-widths
          let each control flow to a new line instead of crushing. */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] sm:max-w-[260px]">
          <Input
            name="search"
            className="w-full"
            inputClassName="w-full"
            placeholder="사용자/닉네임/이메일 검색"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updatePagination();
              }
            }}
          />
        </div>
        <SelectInput
          name="auth_level"
          items={[
            { value: "all", label: "권한레벨 전체" },
            ...map(levelData?.max_system_level ?? 10, (index) => ({
              value: String(index + 1),
              label: String(index + 1),
            })),
          ]}
          buttonClassName="!w-fit"
        />
        <SelectInput
          name="sort"
          items={[
            { value: "created_desc", label: "최신 가입순" },
            { value: "created_asc", label: "오래된 가입순" },
            { value: "deposit_desc", label: "보증금 높은순" },
            { value: "deposit_asc", label: "보증금 낮은순" },
            { value: "rank_desc", label: "거래등급 높은순" },
            { value: "rank_asc", label: "거래등급 낮은순" },
            { value: "board_rank_desc", label: "게시판등급 높은순" },
            { value: "board_rank_asc", label: "게시판등급 낮은순" },
          ]}
          buttonClassName="!w-fit"
        />
        <SelectInput
          name="kyc"
          items={[
            { value: "all", label: "KYC 전체" },
            { value: "verified", label: "인증완료" },
            { value: "simulation", label: "시뮬레이션" },
            { value: "unregistered", label: "미등록" },
          ]}
          buttonClassName="!w-fit"
        />
        <SelectInput
          name="has_warranty"
          items={[
            { value: "all", label: "전체 회원" },
            { value: "yes", label: "보증회원만" },
            { value: "no", label: "일반회원만" },
          ]}
          buttonClassName="!w-fit"
        />
        <SelectInput
          name="is_admin"
          items={[
            { value: "all", label: "권한 전체" },
            { value: "yes", label: "관리자만" },
            { value: "no", label: "일반유저만" },
          ]}
          buttonClassName="!w-fit"
        />
        <SelectInput
          name="is_active"
          items={[
            { value: "all", label: "활성상태 전체" },
            { value: "yes", label: "활성 사용자만" },
            { value: "no", label: "비활성 사용자만" },
          ]}
          buttonClassName="!w-fit"
        />
        <Button type="button" onClick={updatePagination} className="!w-fit">
          검색
        </Button>
      </div>

      {/* Mobile / tablet: card list. Hidden on lg+. */}
      <UserMobileList
        users={usersData?.users}
        pagination={usersData?.pagination}
        onPageChange={(index) => {
          methods.setValue("page", String(index));
          updatePagination();
        }}
      />

      {/* Desktop: full DataTable. Hidden below lg. */}
      <div className="w-full hidden lg:block">
        <DataTableSSR
          data={
            usersData?.users
              ? map(usersData.users, (user) => ({
                  username: user.username,
                  displayname: user.profile?.displayname,
                  email: user.profile?.email || "-",
                  created_at: user.created_at,
                  current_rank_level: user.profile?.current_rank_level,
                  current_board_rank_level:
                    user.profile?.current_board_rank_level,
                  auth_level: user.profile?.auth_level,
                  is_admin: user.profile?.is_app_admin ? "Yes" : "No",
                  is_active: user.is_active ? "Yes" : "No",
                  kyc_id: getKycStatus(user.profile?.kyc_id, "ko"),
                  has_warranty: user.profile?.has_warranty
                    ? "보증"
                    : "해당없음",
                  warranty_deposit_amount:
                    user.profile?.warranty_deposit_amount,
                }))
              : []
          }
          columns={columns}
          setPageIndexAction={(index) => {
            methods.setValue("page", String(index));
            updatePagination();
          }}
          pagination={usersData?.pagination}
        />
        <div className="flex justify-end items-center gap-2 mt-2 text-sm text-muted-foreground">
          <span>페이지당</span>
          <SelectInput
            name="pageSize"
            items={[
              { value: "10", label: "10개" },
              { value: "25", label: "25개" },
              { value: "50", label: "50개" },
              { value: "100", label: "100개" },
            ]}
            buttonClassName="!w-fit"
            onChange={(value) => {
              methods.setValue("pageSize", String(value));
              methods.setValue("page", "1");
              updatePagination();
            }}
          />
        </div>
      </div>
    </FormProvider>
  );
}
