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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { map } from "@/helpers/basic";
import { inputToLocaleString } from "@/helpers/inputUtils";
import { TetherPriceTypes } from "@/helpers/types";
import { validateTradeFixedPrice, validateTradeType } from "@/helpers/validate";
import Decimal from "decimal.js";
import { useFormContext } from "react-hook-form";
import type { InnerTetherWithProfile } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/hook";

export const PriceCard = () => {
  const { setValue } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">가격</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <FormBuilder name="trade_type" label="거래 유형" formClassName="!gap-0">
          <ToggleGroupInput
            name="trade_type"
            variant="outline"
            orientation="horizontal"
            className="justify-start mt-2"
            validate={validateTradeType}
            onValueChange={(value) => {
              if (!value) return;
              setValue("trade_type", value);
            }}
          >
            {map(
              [
                { name: "판매", value: "sell" },
                { name: "구매", value: "buy" },
              ],
              (trade_type) => (
                <ToggleGroupItem
                  key={`trade_type*${trade_type.value}`}
                  value={trade_type.value}
                  aria-label={trade_type.name}
                >
                  {trade_type.name}
                </ToggleGroupItem>
              )
            )}
          </ToggleGroupInput>
        </FormBuilder>

        <WithUseWatch name={["price_type"]}>
          {({ price_type }: InnerTetherWithProfile) => {
            const isNegotiation = price_type === TetherPriceTypes.Negotiation;
            return (
              <div className="flex flex-col gap-2">
                <FormInput
                  name="price"
                  label="단가 (원)"
                  inputClassName="relative"
                  disabled={isNegotiation}
                  validate={(value) =>
                    validateTradeFixedPrice(value, !isNegotiation)
                  }
                  onChange={(event) =>
                    inputToLocaleString({
                      event,
                      setValues: setValue,
                    })
                  }
                >
                  <p className="absolute right-4 top-1/2 -translate-y-1/2">₩</p>
                </FormInput>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="price_type_negotiation"
                    checked={isNegotiation}
                    onCheckedChange={(next) => {
                      if (next === true) {
                        setValue("price_type", TetherPriceTypes.Negotiation);
                        setValue("price", new Decimal(0));
                      } else {
                        setValue("price_type", TetherPriceTypes.Fixed);
                      }
                    }}
                  />
                  <Label
                    htmlFor="price_type_negotiation"
                    className="cursor-pointer"
                  >
                    가격 협의하기
                  </Label>
                </div>
              </div>
            );
          }}
        </WithUseWatch>
      </CardContent>
    </Card>
  );
};
