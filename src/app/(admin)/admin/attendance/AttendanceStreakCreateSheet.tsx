"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJson, refreshCache } from "@/helpers/common";
import { useToast } from "@/components/ui/use-toast";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { AttendanceStreakCreateProps } from "@/app/api/admin_di2u3k2j/attendance/streaks/create";

interface StreakForm {
  day_count: string;
  bonus_points: string;
  label: string;
  is_active: boolean;
}

const defaults = (): StreakForm => ({
  day_count: "1",
  bonus_points: "0",
  label: "",
  is_active: true,
});

export default function AttendanceStreakCreateSheet() {
  const closeRef = useRef<HTMLButtonElement>(null);
  const methods = useForm<StreakForm>({
    defaultValues: defaults(),
    reValidateMode: "onSubmit",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (form: StreakForm) => {
      const { isSuccess, hasMessage } =
        await postJson<AttendanceStreakCreateProps>(
          ApiRoute.adminAttendanceStreaksCreate,
          {
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
        methods.reset(defaults());
        closeRef.current?.click();
      }
    },
    onError: () => toast({ id: ToastData.unknown, type: "error" }),
  });

  const submit = (form: StreakForm) => {
    if (mutation.isPending) return;
    mutation.mutate(form);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" className="!w-fit">
          보너스 추가
        </Button>
      </SheetTrigger>
      <SheetContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>연속 보너스 추가</SheetTitle>
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
              <SheetClose ref={closeRef} className="hidden" />
            </Form>
          </FormProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
