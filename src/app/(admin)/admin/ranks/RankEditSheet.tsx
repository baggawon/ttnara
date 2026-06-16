"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdminRanksEditHook } from "@/app/(admin)/admin/ranks/[rank]/hook";
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
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Upload, X } from "lucide-react";
import { AdminAppRoute } from "@/helpers/types";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";

export default function RankEditSheet({
  rankId,
  onClose,
}: {
  rankId: number | null;
  onClose: () => void;
}) {
  const {
    methods,
    submit,
    currentRank,
    uploadBadge,
    unsetBadge,
    isUploadingBadge,
    isSubmitting,
  } = useAdminRanksEditHook(rankId, onClose);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const badgeUrl = currentRank?.badge_image ?? "";

  const onPickFile = () => fileInputRef.current?.click();
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    uploadBadge(file);
  };

  return (
    <Sheet open={rankId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        // Only the Cancel/X buttons may close — suppress click-outside and ESC
        // dismissals so admins don't lose in-progress input.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>등급 수정</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FormProvider {...methods}>
            <Form onSubmit={submit} className="space-y-4">
              <FormInput name="name" label="이름" validate={validateRankName} />
              <FormInput
                name="rank_level"
                type={InputType.number}
                label="등급"
                min={1}
                validate={(value) => validateNumber({ value, min: 1 })}
              />
              <FormInput
                name="min_trade_count"
                type={InputType.number}
                label="최소 거래 횟수"
                min={0}
                validate={(value) => validateNumber({ value, positive: true })}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">배지 이미지</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 shrink-0 rounded border bg-muted/30 flex items-center justify-center overflow-hidden">
                    {badgeUrl ? (
                      <Image
                        src={badgeUrl}
                        alt={`rank-${currentRank?.rank_level}-badge`}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-contain"
                        unoptimized
                      />
                    ) : (
                      <ImagePlus className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={onFileSelected}
                  />
                  <Button
                    type="button"
                    onClick={onPickFile}
                    disabled={isUploadingBadge}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {badgeUrl ? "교체" : "업로드"}
                  </Button>
                  {badgeUrl && (
                    <ConfirmDialog
                      title="배지 이미지 해제"
                      description="이 이미지를 공유하는 모든 등급에서 함께 해제됩니다. 계속하시겠습니까?"
                      onConfirm={unsetBadge}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isUploadingBadge}
                      >
                        <X className="w-4 h-4 mr-1" />
                        해제
                      </Button>
                    </ConfirmDialog>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG / JPG / WebP / SVG, 최대 2MB.{" "}
                  <Link
                    href={AdminAppRoute.RankBadges}
                    className="underline hover:text-foreground"
                  >
                    배지 이미지 관리
                  </Link>
                  에서 여러 등급에 같은 이미지를 할당할 수도 있습니다.
                </p>
                {badgeUrl && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ※ 해제 시 이 이미지를 공유하는 모든 등급에서 함께
                    해제됩니다.
                  </p>
                )}
              </div>
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
            </Form>
          </FormProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
