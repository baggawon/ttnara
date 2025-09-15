"use client";

import { Tether } from "@/components/1_atoms/coin/Tether";
import { Tron } from "@/components/1_atoms/coin/Tron";
import { FreeTrade } from "@/components/1_atoms/FreeTrade";
import { PromiseTransaction } from "@/components/1_atoms/PromiseTransaction";
import {
  FormBuilder,
  FormInput,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBoolean, map } from "@/helpers/basic";
import { Currency, TetherMethods, type UserAndSettings } from "@/helpers/types";
import {
  validateCoin,
  validateTradeMethod,
  validateTradePassword,
  validateTradeType,
} from "@/helpers/validate";
import type { InnerTetherWithProfile } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/hook";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { EasyTooltip } from "@/components/1_atoms/EasyTooltip";
import { CircleHelp } from "lucide-react";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";

export const TradeType = ({
  userData,
}: {
  userData: UserAndSettings | null;
}) => {
  const { setValue } = useFormContext(); // retrieve all hook methods
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">거래유형</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormBuilder name="currency" label="코인 선택" formClassName="!gap-0">
          <ToggleGroupInput
            name="currency"
            variant="outline"
            orientation="horizontal"
            className="justify-start mt-4"
            validate={validateCoin}
          >
            {map(
              [
                {
                  name: (
                    <>
                      <Tether className="!w-5 !h-5" /> 테더
                    </>
                  ),
                  value: Currency.테더,
                },
                {
                  name: (
                    <>
                      <Tron className="!w-5 !h-5" /> 트론
                    </>
                  ),
                  value: Currency.트론,
                },
              ],
              (currency) => (
                <ToggleGroupItem
                  key={`${currency.value}`}
                  value={currency.value}
                  aria-label={currency.value}
                >
                  {currency.name}
                </ToggleGroupItem>
              )
            )}
          </ToggleGroupInput>
        </FormBuilder>

        <FormBuilder name="trade_type" label="거래 선택" formClassName="!gap-0">
          <ToggleGroupInput
            name="trade_type"
            variant="outline"
            orientation="horizontal"
            className="justify-start mt-4"
            validate={validateTradeType}
          >
            {map(
              [
                { name: "판매", value: "sell" },
                { name: "구매", value: "buy" },
              ],
              (trade_type) => (
                <ToggleGroupItem
                  key={`${trade_type.name}*&*${trade_type.value}`}
                  value={trade_type.value}
                  aria-label={trade_type.name}
                >
                  {trade_type.name}
                </ToggleGroupItem>
              )
            )}
          </ToggleGroupInput>
        </FormBuilder>

        <FormBuilder
          name="methods"
          label="거래수단 선택"
          formClassName="!gap-0"
        >
          <ToggleGroupInput
            name="methods"
            variant="outline"
            orientation="horizontal"
            className="justify-start mt-4"
            validate={validateTradeMethod}
            onValueChange={(value) => {
              setValue("methods", value);
              if (value === TetherMethods.Public) {
                setValue("password", "");
              }
            }}
          >
            {map(
              [
                {
                  name: TetherMethods.Public,
                  value: TetherMethods.Public,
                  label: <FreeTrade />,
                },
                {
                  name: TetherMethods.Promise,
                  value: TetherMethods.Promise,
                  label: <PromiseTransaction />,
                },
              ],
              (methods) => (
                <ToggleGroupItem
                  key={`${methods.name}*&*${methods.value}`}
                  value={methods.value}
                  aria-label={methods.name}
                >
                  {methods.label}
                </ToggleGroupItem>
              )
            )}
          </ToggleGroupInput>
        </FormBuilder>

        <WithUseWatch name={["methods", "isPasswordShow"]}>
          {({ methods: method, isPasswordShow }: InnerTetherWithProfile) => (
            <FormInput
              name="password"
              type={
                getBoolean(isPasswordShow) ? InputType.text : InputType.password
              }
              label="거래 비밀번호"
              disabled={method === TetherMethods.Public || method === ""}
              validate={(value) =>
                validateTradePassword(value, method === TetherMethods.Promise)
              }
              formClassName="!gap-0 [&>div:first-child]:mb-4 [&>div:last-child]:mt-2"
              inputClassName="relative flex-col"
              isErrorVislble
              isOuterChildren
              beforeChildren={
                <Button
                  variant="ghost"
                  type="button"
                  className="absolute right-0 top-0"
                  disabled={method === TetherMethods.Public || method === ""}
                  onClick={() =>
                    setValue("isPasswordShow", !getBoolean(isPasswordShow))
                  }
                >
                  {getBoolean(isPasswordShow) ? "가리기" : "보이기"}
                </Button>
              }
            >
              <CardDescription className="text-xs w-full">
                4자리 숫자로 입력해주세요.
              </CardDescription>
            </FormInput>
          )}
        </WithUseWatch>

        <div className="col-span-1 hidden md:block" />

        <FormBuilder
          name="use_author"
          label={
            <EasyTooltip
              button={
                <div className="flex gap-1 items-center">
                  KYC인증 필수
                  <CircleHelp
                    width={16}
                    height={16}
                    className="cursor-pointer"
                  />
                </div>
              }
            >
              활성화하면 인증을 완료한 사용자만 거래가 가능합니다.
              <br />
              활성화 하려면 먼저 KYC 인증을 완료해야 합니다.
            </EasyTooltip>
          }
        >
          <div className="w-full">
            <SwitchInput
              name="use_author"
              disabled={userData?.profile?.kyc_id === null}
            />
          </div>
        </FormBuilder>
      </CardContent>
    </Card>
  );
};
