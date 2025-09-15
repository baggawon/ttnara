"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import {
  validateTradeFixedPrice,
  validateTradeMaxQty,
  validateTradeMinQty,
  validateTradePriceType,
} from "@/helpers/validate";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { type InnerTetherWithProfile } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/hook";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import { map } from "@/helpers/basic";
import { inputToLocaleString } from "@/helpers/inputUtils";
import { type Currency, TetherPriceTypes } from "@/helpers/types";
import Decimal from "decimal.js";
import { EasyTooltip } from "@/components/1_atoms/EasyTooltip";
import { CircleHelp } from "lucide-react";
import clsx from "clsx";
import { getCoin } from "@/helpers/common";
import { useFormContext } from "react-hook-form";

export const Price = () => {
  const { setValue } = useFormContext(); // retrieve all hook methods
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">가격</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormBuilder
          name="price_type"
          label="가격 기준선택"
          formClassName="!gap-0"
        >
          <WithUseWatch name={["price_type"]}>
            {({ price_type }: InnerTetherWithProfile) => (
              <ToggleGroupInput
                name="price_type"
                variant="outline"
                orientation="horizontal"
                className="justify-start mt-4"
                validate={validateTradePriceType}
                onValueChange={(value) => {
                  setValue("price_type", value);
                  if (value === TetherPriceTypes.Fixed) {
                    setValue("margin", new Decimal(0));
                  } else if (value === TetherPriceTypes.Margin) {
                    setValue("price", new Decimal(0));
                  } else if (value === TetherPriceTypes.Negotiation) {
                    setValue("price", new Decimal(0));
                    setValue("margin", new Decimal(0));
                  }
                }}
              >
                {map(
                  [
                    {
                      name: "고정 가격",
                      value: TetherPriceTypes.Fixed,
                      tooltip:
                        "거래의 판매가를 고정하며 시장가의 변동과 상관없이 고정됩니다.",
                    },
                    {
                      name: "가격 협의",
                      value: TetherPriceTypes.Negotiation,
                      tooltip:
                        "거래의 판매가를 고정하며 시장가의 변동과 상관없이 고정됩니다.",
                    },
                    // {
                    //   name: "시장 가격",
                    //   value: TetherPriceTypes.Margin,
                    //   tooltip:
                    //     "거래의 판매가가 테더 시장가의 변동에 따라 바뀌게 됩니다.",
                    // },
                  ],
                  (trade_type) => (
                    <EasyTooltip
                      key={`${trade_type.name}*&*${trade_type.value}`}
                      button={
                        <ToggleGroupItem
                          value={trade_type.value}
                          aria-label={trade_type.name}
                          className={clsx(
                            price_type === trade_type.value && "bg-accent"
                          )}
                        >
                          {trade_type.name}

                          <CircleHelp
                            width={20}
                            height={20}
                            className="cursor-pointer"
                          />
                        </ToggleGroupItem>
                      }
                    >
                      {trade_type.tooltip}
                    </EasyTooltip>
                  )
                )}
              </ToggleGroupInput>
            )}
          </WithUseWatch>
        </FormBuilder>
        <WithUseWatch name={["max_qty", "currency"]}>
          {({ max_qty, currency }: InnerTetherWithProfile) => (
            <FormInput
              name="min_qty"
              label="최소 거래 개수"
              inputClassName="relative"
              validate={(value) =>
                validateTradeMinQty(value, max_qty.toString())
              }
              onChange={(event) =>
                inputToLocaleString({
                  event,
                  setValues: setValue,
                })
              }
            >
              <p className="absolute right-4 top-1/2 -translate-y-1/2">
                {getCoin(currency as Currency)}
              </p>
            </FormInput>
          )}
        </WithUseWatch>

        <WithUseWatch name={["min_qty", "currency"]}>
          {({ min_qty, currency }: InnerTetherWithProfile) => (
            <FormInput
              name="max_qty"
              label="최대 거래 개수"
              inputClassName="relative"
              validate={(value) =>
                validateTradeMaxQty(value, min_qty.toString())
              }
              onChange={(event) =>
                inputToLocaleString({
                  event,
                  setValues: setValue,
                })
              }
            >
              <p className="absolute right-4 top-1/2 -translate-y-1/2">
                {getCoin(currency as Currency)}
              </p>
            </FormInput>
          )}
        </WithUseWatch>

        <WithUseWatch name={["price_type"]}>
          {({ price_type }: InnerTetherWithProfile) => {
            const isDisable = price_type !== TetherPriceTypes.Fixed;
            return (
              <FormInput
                name="price"
                label="고정 가격"
                inputClassName="relative"
                disabled={isDisable}
                validate={(value) => validateTradeFixedPrice(value, !isDisable)}
                onChange={(event) =>
                  inputToLocaleString({
                    event,
                    setValues: setValue,
                  })
                }
              >
                <p className="absolute right-4 top-1/2 -translate-y-1/2">원</p>
              </FormInput>
            );
          }}
        </WithUseWatch>

        {/* <WithUseWatch name={["price_type"]}>
        {({ price_type }: InnerTetherWithProfile) => {
          const isDisable = price_type !== TetherPriceTypes.Margin;
          return (
            <FormInput
              name="margin"
              label="거래 마진"
              inputClassName="relative"
              disabled={isDisable}
              validate={(value) =>
                validateTradeMargin(value, !isDisable)
              }
              onChange={(event) =>
                inputToLocaleString({
                  event,
                  decimal: 2,
                  setValues: setValue,
                })
              }
            >
              <p className="absolute right-4 top-1/2 -translate-y-1/2">
                %
              </p>
            </FormInput>
          );
        }}
      </WithUseWatch> */}
      </CardContent>
    </Card>
  );
};
