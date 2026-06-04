"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAdminRanksCreateHook } from "@/app/(admin)/admin/ranks/create/hook";
import { FormProvider } from "react-hook-form";
import {
  FormBuilder,
  FormInput,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { validateNumber, validateRankName } from "@/helpers/validate";
import { useRef } from "react";

export default function RankCreateSheet() {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { methods, submit, isSubmitting } = useAdminRanksCreateHook(() => {
    closeRef.current?.click();
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" className="!w-fit">
          생성
        </Button>
      </SheetTrigger>
      <SheetContent
        // Only the Cancel/X buttons may close — suppress click-outside and ESC
        // dismissals so admins don't lose in-progress input.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>신규 등급 추가</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FormProvider {...methods}>
            <Form onSubmit={submit} className="space-y-4">
              <FormInput name="name" label="이름" validate={validateRankName} />
              <FormInput
                name="rank_level"
                type={InputType.number}
                label="등급 레벨"
                min={1}
                validate={(value) => validateNumber({ value, min: 1 })}
              />
              <FormInput
                name="min_trade_count"
                type={InputType.number}
                label="최소 거래 횟수"
                min={0}
                max={10000000}
                validate={(value) => validateNumber({ value, positive: true })}
              />
              <FormTextarea name="description" label="설명" />
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
                <Button type="submit" disabled={isSubmitting}>
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
