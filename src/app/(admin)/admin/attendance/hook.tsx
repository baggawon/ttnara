"use client";

import type { attendance_streak } from "@prisma/client";
import type {
  AttendanceStreaksListResponse,
  AttendanceStreaksReadProps,
} from "@/app/api/admin_di2u3k2j/attendance/streaks/read";
import type { AttendanceSettingReadResult } from "@/app/api/admin_di2u3k2j/attendance/setting/read";
import type { AttendanceStreakDeleteProps } from "@/app/api/admin_di2u3k2j/attendance/streaks/delete";
import type { AttendanceSettingUpdateProps } from "@/app/api/admin_di2u3k2j/attendance/setting/update";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminAttendanceSettingGet,
  adminAttendanceStreaksGet,
} from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface SettingForm {
  is_enabled: boolean;
  daily_points: string;
}

export const useAdminAttendanceHook = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---- Singleton setting ----
  const { data: settingData } = useGetQuery<
    AttendanceSettingReadResult,
    undefined
  >(
    { queryKey: [QueryKey.attendanceSetting] },
    adminAttendanceSettingGet,
    undefined,
    { silent: true }
  );

  const settingMethods = useForm<SettingForm>({
    defaultValues: { is_enabled: true, daily_points: "10" },
    reValidateMode: "onSubmit",
  });

  // Hydrate the form once the singleton arrives (and on later refetches).
  useEffect(() => {
    if (settingData) {
      settingMethods.reset({
        is_enabled: settingData.is_enabled,
        daily_points: String(settingData.daily_points),
      });
    }
  }, [settingData]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettingMutation = useMutation({
    mutationFn: async (form: SettingForm) => {
      const { isSuccess, hasMessage } =
        await postJson<AttendanceSettingUpdateProps>(
          ApiRoute.adminAttendanceSettingUpdate,
          {
            is_enabled: form.is_enabled,
            daily_points: Number(form.daily_points),
          }
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        toast({ id: "출석 설정이 저장되었습니다.", type: "success" });
        refreshCache(queryClient, QueryKey.attendanceSetting);
      }
    },
    onError: () => toast({ id: ToastData.unknown, type: "error" }),
  });

  const saveSetting = settingMethods.handleSubmit((form) => {
    if (saveSettingMutation.isPending) return;
    saveSettingMutation.mutate(form);
  });

  // ---- Streak milestone list ----
  const [pagination, setPagination] = useState<AttendanceStreaksReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: streaksData } = useGetQuery<
    AttendanceStreaksListResponse,
    AttendanceStreaksReadProps
  >(
    { queryKey: [{ [QueryKey.attendanceStreaks]: pagination }] },
    adminAttendanceStreaksGet,
    pagination,
    { silent: true }
  );

  const setPage = (page: number) => setPagination((p) => ({ ...p, page }));

  const [editStreakId, setEditStreakId] = useState<number | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const deleteStreak = async (index: number) => {
    if (!streaksData || isWorking) return;
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } =
        await postJson<AttendanceStreakDeleteProps>(
          ApiRoute.adminAttendanceStreaksDelete,
          { deleteStreakId: streaksData.streaks[index].id }
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) refreshCache(queryClient, QueryKey.attendanceStreaks);
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setIsWorking(false);
  };

  const columns: CustomColumDef<attendance_streak>[] = setDefaultColumn([
    { accessorKey: "day_count", headerTitle: "연속일수" },
    {
      accessorKey: "bonus_points",
      headerTitle: "보너스 포인트",
      cell: (props) => `${props.getValue() ?? 0}P`,
    },
    {
      accessorKey: "label",
      headerTitle: "라벨",
      cell: (props) =>
        (props.getValue() as string | null) || (
          <span className="text-muted-foreground">-</span>
        ),
    },
    { accessorKey: "is_active", headerTitle: "활성화" },
    {
      accessorKey: "control",
      headerTitle: "수정",
      cell: (props) => (
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            className="!p-2 !h-fit"
            onClick={() =>
              setEditStreakId(streaksData?.streaks[props.row.index].id ?? null)
            }
          >
            수정
          </Button>
          <ConfirmDialog
            title="보너스 삭제"
            description="이 연속 보너스를 삭제하시려면 확인을 눌러주세요."
            onConfirm={() => deleteStreak(props.row.index)}
          >
            <Button type="button" className="!p-2 !h-fit" variant="outline">
              삭제
            </Button>
          </ConfirmDialog>
        </div>
      ),
    },
  ]);

  return {
    settingMethods,
    saveSetting,
    isSavingSetting: saveSettingMutation.isPending,
    columns,
    streaksData,
    setPage,
    editStreakId,
    setEditStreakId,
  };
};
