"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { validateContactId, validatePreferredTime } from "@/helpers/validate";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { EasyTooltip } from "@/components/1_atoms/EasyTooltip";
import { CircleHelp, EyeOff } from "lucide-react";
import { DisplayRank } from "@/components/1_atoms/DisplayRank";
import { KYCAuthor } from "@/components/1_atoms/KYCAuthor";
import { CircleLight } from "@/components/1_atoms/CircleLight";
import { Telegram } from "@/components/1_atoms/assets/Telegram";
import { Kakaotalk } from "@/components/1_atoms/assets/Kakaotalk";
import {
  TetherProposalMessengerTypes,
  type UserAndSettings,
} from "@/helpers/types";
import { getDisplayname } from "@/helpers/common";
import { getBoolean } from "@/helpers/basic";
import { useFormContext } from "react-hook-form";
import type { InnerTetherWithProfile } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/hook";

const getSuccessPercent = (
  trade_total?: number | null,
  trade_count?: number | null,
  trade_joined?: number | null
) => {
  const total = trade_total ?? 0;
  const count = trade_count ?? 0;
  const joined = trade_joined ?? 0;
  const denominator = total + joined;
  if (denominator === 0 || count === 0) return "0.00";
  const percent = (count / denominator) * 100;
  if (percent < 0) return "0.00";
  if (percent > 100) return "100.00";
  return percent.toFixed(2);
};

export const OrdererInfoCard = ({
  userData,
}: {
  userData: UserAndSettings | null;
}) => {
  const { setValue } = useFormContext<InnerTetherWithProfile>();
  const profile = userData?.profile ?? null;
  const kycVerified =
    typeof profile?.kyc_id === "string" && profile.kyc_id !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">주문자 정보</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <DisplayRank
              rank_level={profile?.current_rank_level ?? 1}
              rank_image={profile?.current_rank_image ?? "bronze.png"}
              rank_name={profile?.current_rank_name ?? "브론즈"}
            />
            <span className="font-bold text-lg">
              {getDisplayname(profile) || userData?.username || "-"}
            </span>
            {kycVerified && <KYCAuthor />}
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <p>총 거래: {userData?.trade_count ?? 0}회</p>
            <p>
              성사율:{" "}
              {getSuccessPercent(
                userData?.trade_total,
                userData?.trade_count,
                userData?.trade_joined
              )}
              %
            </p>
            <p className="flex items-center gap-1">
              <CircleLight value={kycVerified} />
              KYC 인증
            </p>
          </div>

          <FormBuilder
            name="use_author"
            label={
              <EasyTooltip
                button={
                  <div className="flex gap-1 items-center">
                    KYC 인증자만 신청 가능
                    <CircleHelp
                      width={16}
                      height={16}
                      className="cursor-pointer"
                    />
                  </div>
                }
              >
                활성화하면 KYC 인증을 완료한 사용자만 거래 신청이 가능합니다.
                <br />
                활성화하려면 먼저 본인의 KYC 인증을 완료해야 합니다.
              </EasyTooltip>
            }
          >
            <div className="w-full">
              <SwitchInput name="use_author" disabled={!kycVerified} />
            </div>
          </FormBuilder>
        </div>

        <WithUseWatch name={["hide_contact", "contact_method"]}>
          {({ hide_contact, contact_method }: InnerTetherWithProfile) => {
            const isPrivate = getBoolean(hide_contact);
            const toggleValue = isPrivate
              ? "private"
              : ((contact_method as string | null) ?? "");
            return (
              <div className="flex flex-col gap-4">
                <FormBuilder
                  name="contact_method"
                  label="선호 연락수단"
                  formClassName="!gap-0"
                >
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={toggleValue}
                    onValueChange={(value) => {
                      if (!value) return;
                      if (value === "private") {
                        setValue("hide_contact", true, { shouldDirty: true });
                      } else {
                        setValue("hide_contact", false, { shouldDirty: true });
                        setValue("contact_method", value, {
                          shouldDirty: true,
                        });
                      }
                    }}
                    className="justify-start mt-2"
                  >
                    <ToggleGroupItem
                      value={TetherProposalMessengerTypes.Telegram}
                      aria-label={TetherProposalMessengerTypes.Telegram}
                    >
                      <span className="flex items-center gap-2">
                        <Telegram className="w-4 h-4" />
                        텔레그램
                      </span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value={TetherProposalMessengerTypes.KakaoTalk}
                      aria-label={TetherProposalMessengerTypes.KakaoTalk}
                    >
                      <span className="flex items-center gap-2">
                        <Kakaotalk className="w-4 h-4" />
                        카카오톡
                      </span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="private" aria-label="비공개">
                      <span className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        비공개
                      </span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormBuilder>

                <FormInput
                  name="preferred_time"
                  label="선호 시간대"
                  disabled={isPrivate}
                  placeholder="예: 평일 저녁 7시 이후"
                  validate={(value) =>
                    isPrivate ? undefined : validatePreferredTime(value)
                  }
                />

                <FormInput
                  name="contact_id"
                  label="아이디"
                  disabled={isPrivate}
                  placeholder="메신저 아이디"
                  validate={(value) =>
                    isPrivate ? undefined : validateContactId(value)
                  }
                />
              </div>
            );
          }}
        </WithUseWatch>
      </CardContent>
    </Card>
  );
};
