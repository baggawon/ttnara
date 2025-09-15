"use client";

import { FormInput } from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import { FormProvider } from "react-hook-form";
import { useAdminUserEditHook } from "@/app/(admin)/admin/users/[user_id]/edit/hook";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import Form from "@/components/1_atoms/Form";
import {
  validateAuthLevel,
  validateNickName,
  validatePoint,
  validateUserLevel,
  validateValidEmail,
} from "@/helpers/validate";
import dayjs from "dayjs";

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

export default function AdminUserEditForm({ user_id }: { user_id: string }) {
  const {
    methods,
    userData,
    levelData,
    userSettingData,
    goBackList,
    submit,
    cancelEdit,
  } = useAdminUserEditHook(user_id);

  const kycStatus = getKycStatus(userData?.profile?.kyc_id);

  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <FormProvider {...methods}>
        {userData && (
          <Form onSubmit={submit} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">사용자 정보 편집</h2>
                <p className="text-muted-foreground">{userData.username}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={goBackList}
                  variant="outline"
                  size="sm"
                >
                  목록으로
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelEdit}
                  size="sm"
                >
                  취소
                </Button>
                <Button type="submit" size="sm">
                  저장
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Info Card - Takes 2 columns */}
              <Card className="md:col-span-2">
                <CardContent className="mt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex flex-1 gap-4">
                      <FormInput name="username" label="사용자" />
                      <FormInput
                        name="profile.displayname"
                        label="닉네임"
                        validate={(value) =>
                          validateNickName(value, userSettingData)
                        }
                      />
                      <FormInput name="profile.email" label="이메일" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormInput
                        name="profile.user_level"
                        label="사용자 레벨"
                        validate={validateUserLevel}
                      />
                      <FormInput
                        name="profile.auth_level"
                        label="권한 레벨"
                        validate={(value) =>
                          validateAuthLevel(value, levelData)
                        }
                      />
                    </div>
                    <div className="space-y-4">
                      <FormInput
                        name="profile.point"
                        label="포인트"
                        validate={validatePoint}
                      />
                      <FormInput
                        name="trade_count"
                        label="거래 횟수"
                        validate={validatePoint}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Card */}
              <Card className="bg-primary/5">
                <CardContent className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">계정 권한</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm">관리자 권한</Label>
                        <SwitchInput name="profile.is_app_admin" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        관리자 권한을 부여하거나 해제합니다
                      </p>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm">활성화 상태</Label>
                        <SwitchInput name="is_active" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        계정의 활성화 상태를 변경합니다
                      </p>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm">거래 보증 상태</Label>
                        <SwitchInput name="profile.has_warranty" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {userData.profile?.has_warranty
                          ? "거래 보증이 완료된 계정입니다"
                          : "거래 보증이 완료되지 않은 계정입니다"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KYC Info Card - Takes full width */}
              <Card className="md:col-span-3 bg-card">
                <CardHeader>
                  <CardTitle>KYC 정보</CardTitle>
                </CardHeader>
                <CardContent className="mt-6">
                  {kycStatus === "Unregistered" ? (
                    <div className="py-12 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <title>KYC 인증 등록 안내 아이콘</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-muted-foreground">
                        KYC 인증이 등록되지 않았습니다
                      </p>
                    </div>
                  ) : kycStatus === "Simulation" ? (
                    <div className="py-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="font-medium">시뮬레이션 KYC 인증</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        이 사용자는 관리자에 의해 수동으로 KYC 인증이
                        부여되었습니다. 실제 KYC 인증 정보는 존재하지 않습니다.
                      </p>
                    </div>
                  ) : kycStatus === "Verified" ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          인증 결과
                        </Label>
                        <p className="text-base font-medium">
                          {userData?.kyc[0]?.result_type === 1
                            ? "인증완료"
                            : "인증실패"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          금융기관
                        </Label>
                        <p className="text-base font-medium">
                          {userData?.kyc[0]?.finance_company || "-"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          계좌번호
                        </Label>
                        <p className="text-base font-medium">
                          {userData?.kyc[0]?.account_number || "-"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          예금주
                        </Label>
                        <p className="text-base font-medium">
                          {userData?.kyc[0]?.account_holder || "-"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          등록일
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {userData?.kyc[0]?.created_at
                            ? dayjs(userData.kyc[0].created_at)
                                .tz("Asia/Seoul")
                                .format("YYYY-MM-DD HH:mm:ss")
                            : "-"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          인증 결과
                        </Label>
                        <p className="text-base font-medium">
                          KYC 인증상태에 오류가 있습니다.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          금융기관
                        </Label>
                        <p className="text-base font-medium">--</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          계좌번호
                        </Label>
                        <p className="text-base font-medium">--</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          예금주
                        </Label>
                        <p className="text-base font-medium">--</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          등록일
                        </Label>
                        <p className="text-sm text-muted-foreground">--</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Form>
        )}
      </FormProvider>
    </section>
  );
}
