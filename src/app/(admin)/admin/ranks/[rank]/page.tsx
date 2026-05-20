"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminRanksEditHook } from "./hook";
import { FormProvider } from "react-hook-form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import { InputType } from "@/components/2_molecules/Input/FormInput";
import { validateNumber, validateRankName } from "@/helpers/validate";
import { use, useRef } from "react";
import Image from "next/image";
import { ImagePlus, Upload, X } from "lucide-react";
import Link from "next/link";
import { AdminAppRoute } from "@/helpers/types";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";

export default function RanksEditPage({
  params,
}: {
  params: Promise<{ rank: string }>;
}) {
  const resolvedParams = use(params);
  const rankId = parseInt(resolvedParams.rank);
  const {
    methods,
    goBack,
    submit,
    currentRank,
    uploadBadge,
    unsetBadge,
    isUploadingBadge,
  } = useAdminRanksEditHook(rankId);
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
    <FormProvider {...methods}>
      <Form onSubmit={submit}>
        <section className="w-full flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>등급 수정</CardTitle>
            </CardHeader>
            <CardContent className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full gap-2">
                <Button type="button" onClick={goBack} variant="outline">
                  목록으로
                </Button>
                <Button type="submit">저장</Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </Form>
    </FormProvider>
  );
}
