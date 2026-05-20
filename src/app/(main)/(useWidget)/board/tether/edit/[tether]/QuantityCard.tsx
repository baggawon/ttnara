"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { map } from "@/helpers/basic";
import { Tether } from "@/components/1_atoms/coin/Tether";
import { Tron } from "@/components/1_atoms/coin/Tron";
import { inputToLocaleString } from "@/helpers/inputUtils";
import { Currency } from "@/helpers/types";
import {
  validateCoin,
  validateTradeMaxQty,
  validateTradeMinQty,
} from "@/helpers/validate";
import { getCoin } from "@/helpers/common";
import { useFormContext } from "react-hook-form";
import type { InnerTetherWithProfile } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/hook";

export const QuantityCard = () => {
  const { setValue } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">수량</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormBuilder name="currency" label="코인" formClassName="!gap-0">
          <ToggleGroupInput
            name="currency"
            variant="outline"
            orientation="horizontal"
            className="justify-start mt-2"
            validate={validateCoin}
            onValueChange={(value) => {
              if (!value) return;
              setValue("currency", value);
            }}
          >
            {map(
              [
                {
                  name: (
                    <>
                      <Tether className="!w-5 !h-5" /> USDT
                    </>
                  ),
                  value: Currency.테더,
                },
                {
                  name: (
                    <>
                      <Tron className="!w-5 !h-5" /> TRX
                    </>
                  ),
                  value: Currency.트론,
                },
              ],
              (currency) => (
                <ToggleGroupItem
                  key={`currency*${currency.value}`}
                  value={currency.value}
                  aria-label={currency.value}
                >
                  {currency.name}
                </ToggleGroupItem>
              )
            )}
          </ToggleGroupInput>
        </FormBuilder>

        <WithUseWatch name={["max_qty", "currency"]}>
          {({ max_qty, currency }: InnerTetherWithProfile) => (
            <FormInput
              name="min_qty"
              label="최소"
              inputClassName="relative"
              validate={(value) =>
                validateTradeMinQty(value, String(max_qty ?? ""))
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
              label="최대"
              inputClassName="relative"
              validate={(value) =>
                validateTradeMaxQty(value, String(min_qty ?? ""))
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
      </CardContent>
    </Card>
  );
};
