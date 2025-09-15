"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAdminRanksBatchEditHook } from "@/app/(admin)/admin/ranks/hook";
import { FormProvider } from "react-hook-form";
import { FormInput, InputType } from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import { useRef } from "react";

export default function RanksBatchEditForm() {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { methods, onSubmit, isLoading } = useAdminRanksBatchEditHook(() => {
    closeRef.current?.click();
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="ml-auto">
          일괄 수정
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>일괄 수정</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormInput
                name="rangeStart"
                label="시작 랭크"
                type={InputType.number}
              />
              <FormInput
                name="rangeEnd"
                label="끝 랭크"
                type={InputType.number}
              />
              <FormInput name="name" label="이름" placeholder="랭크 이름" />
              <div>
                <FormInput
                  name="badgeImageUrl"
                  label="배지 이미지 URL"
                  placeholder="public/image.png"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  베이스 URL을 제외한 이미지 경로만 입력해주세요
                </p>
              </div>
              <FormTextarea
                name="description"
                label="설명"
                placeholder="랭크 설명"
              />
              <Button type="submit" disabled={isLoading}>
                수정
              </Button>
              <SheetClose ref={closeRef} className="hidden" />
            </form>
          </FormProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
