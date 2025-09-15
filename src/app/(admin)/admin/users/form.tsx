"use client";

import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { DataTableSSR } from "@/components/2_molecules/Table/DataTableSSR";
import { Button } from "@/components/ui/button";
import { map } from "@/helpers/basic";
import { FormProvider } from "react-hook-form";

import { useAdminUsersListHook } from "./hook";

function getKycStatus(kyc_id: string | null | undefined, lang?: string) {
  if (kyc_id === null || kyc_id === undefined) {
    return lang === "ko" ? "미등록" : "Unregistered";
  }

  // At this point kyc_id is definitely a string
  const numericValue = Number(kyc_id);
  if (isNaN(numericValue)) {
    return lang === "ko" ? "미등록" : "Unregistered"; // handle invalid string values
  }

  if (numericValue === 0) {
    return lang === "ko" ? "시뮬레이션 인증" : "Simulation";
  }

  if (numericValue > 0) {
    return lang === "ko" ? "인증완료" : "Verified";
  }

  return lang === "ko" ? "미등록" : "Unregistered"; // fallback for negative numbers
}

export default function AdminUsersListForm() {
  const { columns, methods, levelData, usersData, updatePagination } =
    useAdminUsersListHook();
  return (
    <FormProvider {...methods}>
      <h2>사용자</h2>
      <div className="w-full flex gap-2">
        <Input
          name="search"
          className="!w-fit"
          inputClassName="!w-[240px]"
          placeholder="사용자/닉네임 검색"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updatePagination();
            }
          }}
        />
        <SelectInput
          name="auth_level"
          items={[
            { value: "all", label: "시스템레벨 전체" },
            ...map(levelData?.max_system_level ?? 10, (index) => ({
              value: String(index + 1),
              label: String(index + 1),
            })),
          ]}
          buttonClassName="!w-fit"
        />
        <SelectInput
          name="order"
          items={[
            { value: "desc", label: "최신 가입순" },
            { value: "asc", label: "오래된 가입순" },
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
      <div className="w-full">
        <DataTableSSR
          data={
            usersData?.users
              ? map(usersData.users, (user) => ({
                  username: user.username,
                  displayname: user.profile?.displayname,
                  email: user.profile?.email,
                  created_at: user.created_at,
                  current_rank_level: user.profile?.current_rank_level,
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
      </div>
    </FormProvider>
  );
}
