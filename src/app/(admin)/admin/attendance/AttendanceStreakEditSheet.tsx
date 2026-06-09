"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FormProvider, useForm } from "react-hook-form";
import {
  FormBuilder,
  FormInput,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { validateNumber } from "@/helpers/validate";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJson, refreshCache } from "@/helpers/common";
import { useToast } from "@/components/ui/use-toast";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { attendance_streak } from "@prisma/client";
import type { AttendanceStreakUpdateProps } from "@/app/api/admin_di2u3k2j/attendance/streaks/update";

interface StreakForm {
  day_count: string;
  bonus_points: string;
  label: string;
  is_active: boolean;
}

export default function AttendanceStreakEditSheet({
  streak,
  onClose,
}: {
  streak: attendance_streak | null;
  onClose: () => void;
}) {
  const methods = useForm<StreakForm>({
    defaultValues: {
      day_count: "1",
      bonus_points: "0",
      label: "",
      is_active: true,
    },
    reValidateMode: "onSubmit",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (streak) {
      methods.reset({
        day_count: String(streak.day_count),
        bonus_points: String(streak.bonus_points),
        label: streak.label ?? "",
        is_active: streak.is_active,
      });
    }
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: async (form: StreakForm) => {
      if (!streak) return;
      const { isSuccess, hasMessage } =
        await postJson<AttendanceStreakUpdateProps>(
          ApiRoute.adminAttendanceStreaksUpdate,
          {
            id: streak.id,
            day_count: Number(form.day_count),
            bonus_points: Number(form.bonus_points),
            label: form.label,
            is_active: form.is_active,
          }
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.attendanceStreaks);
        onClose();
      }
    },
    onError: () => toast({ id: ToastData.unknown, type: "error" }),
  });

  const submit = (form: StreakForm) => {
    if (mutation.isPending) return;
    mutation.mutate(form);
  };

  return (
    <Sheet open={streak !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>연속 보너스 수정</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FormProvider {...methods}>
            <Form onSubmit={submit} className="space-y-4">
              <FormInput
                name="day_count"
                type={InputType.number}
                label="연속일수"
                min={1}
                validate={(value) => validateNumber({ value, min: 1 })}
              />
              <FormInput
                name="bonus_points"
                type={InputType.number}
                label="보너스 포인트"
                min={0}
                validate={(value) => validateNumber({ value, positive: true })}
              />
              <FormTextarea name="label" label="라벨 (선택)" />
              <FormBuilder name="is_active" label="활성화">
                <div className="w-full">
                  <SwitchInput name="is_active" />
                </div>
              </FormBuilder>
              <div className="flex justify-end gap-2">
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    취소
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={mutation.isPending}>
                  저장
                </Button>
              </div>
            </Form>
          </FormProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
