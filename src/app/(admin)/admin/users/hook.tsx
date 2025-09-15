"use client";

import type { level_setting } from "@prisma/client";
import type { LevelReadProps } from "@/app/api/admin_di2u3k2j/settings/level/read";
import type {
  UserForAdmin,
  UsersListResponse,
  UsersReadProps,
} from "@/app/api/admin_di2u3k2j/users/read";
import type { UserSettings } from "@/app/api/signup/read";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { forEach, getYesOrNo } from "@/helpers/basic";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminLevelGet, adminUsersGet, userSettingsGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { AdminAppRoute, QueryKey } from "@/helpers/types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

export interface AdminUsersMethods {
  page: string;
  pageSize: string;
  is_active: string;
  is_admin: string;
  order: string;
  user_level: string;
  auth_level: string;
  search: string;
  editUserData?: UserForAdmin;
  viewUserData?: UserForAdmin;
}

type PaginationProps = {
  page: number;
  pageSize: number;
  is_active?: boolean;
  is_admin?: boolean;
  order?: "asc" | "desc";
  user_level?: number;
  auth_level?: number;
  search?: string;
};

export const useAdminUsersListHook = () => {
  const { data: levelData } = useGetQuery<level_setting, LevelReadProps>(
    {
      queryKey: [QueryKey.levelSettings],
    },
    adminLevelGet
  );

  const [pagination, setPagination] = useState<UsersReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: usersData } = useGetQuery<UsersListResponse, UsersReadProps>(
    {
      queryKey: [{ [QueryKey.users]: pagination }],
    },
    adminUsersGet,
    pagination
  );

  const router = useRouter();

  const updatePagination = () => {
    const prevProps = methods.getValues();
    const newProps: PaginationProps = {
      page: Number(prevProps.page) || 1,
      pageSize: Number(prevProps.pageSize) || 10,
      is_active:
        prevProps.is_active === "all"
          ? undefined
          : getYesOrNo(prevProps.is_active),
      is_admin:
        prevProps.is_admin === "all"
          ? undefined
          : getYesOrNo(prevProps.is_admin),
      order: prevProps.order === "asc" ? ("asc" as "asc" | "desc") : undefined,
      user_level:
        prevProps.user_level === "all"
          ? undefined
          : Number(prevProps.user_level),
      auth_level:
        prevProps.auth_level === "all"
          ? undefined
          : Number(prevProps.auth_level),
      search: prevProps.search === "" ? undefined : prevProps.search,
    };

    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete newProps[key as keyof PaginationProps];
    });
    setPagination(newProps);
  };

  const columns: CustomColumDef<UserForAdmin>[] = setDefaultColumn([
    {
      accessorKey: "username",
      headerTitle: "사용자",
    },
    {
      accessorKey: "displayname",
      headerTitle: "닉네임",
    },
    {
      accessorKey: "email",
      headerTitle: "이메일",
    },
    {
      accessorKey: "created_at",
      headerTitle: "가입일",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      convertValue: (value) =>
        dayjs(value).tz("Asia/Seoul").format("YYYY-MM-DD"),
    },
    {
      accessorKey: "kyc_id",
      headerTitle: "KYC 인증",
      headerClassName: "!max-w-[80px]",
    },
    {
      accessorKey: "current_rank_level",
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
      headerTitle: "랭크",
    },
    {
      accessorKey: "has_warranty",
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
      headerTitle: "보증 회원",
    },
    {
      accessorKey: "warranty_deposit_amount",
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
      headerTitle: "보증금",
    },
    {
      accessorKey: "auth_level",
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
      headerTitle: "시스템레벨",
    },
    {
      accessorKey: "is_admin",
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
      headerTitle: "관리자",
    },
    {
      accessorKey: "is_active",
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
      headerTitle: "활성화",
    },
    {
      accessorKey: "control",
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
      headerTitle: "수정",
      cell: (props) => {
        return (
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              className="!p-2 !h-fit"
              onClick={() =>
                router.push(
                  `${AdminAppRoute.Users}/${usersData?.users[props.row.index].id}`
                )
              }
            >
              보기
            </Button>
            <Button
              type="button"
              className="!p-2 !h-fit"
              onClick={() =>
                router.push(
                  `${AdminAppRoute.Users}/${usersData?.users[props.row.index].id}/edit`
                )
              }
              variant="outline"
            >
              수정
            </Button>
          </div>
        );
      },
    },
  ]);

  const methods = useForm<AdminUsersMethods>({
    defaultValues: {
      page: "1",
      pageSize: "10",
      is_active: "all",
      is_admin: "all",
      order: "desc",
      user_level: "all",
      auth_level: "all",
      search: "",
    },
    reValidateMode: "onSubmit",
  });

  return {
    columns,
    methods,
    updatePagination,
    usersData,
    levelData,
  };
};
