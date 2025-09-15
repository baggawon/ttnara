"use client";

import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type PriceProviderProps,
  usePriceProvider,
} from "@/helpers/customHook/usePriceProvider";
import { Currency } from "@/helpers/types";
import { FormProvider, useForm } from "react-hook-form";
import { Ethereum } from "@/components/1_atoms/coin/Ethereum";
import { Bitcoin } from "@/components/1_atoms/coin/Bitcoin";
import { Tether } from "@/components/1_atoms/coin/Tether";
import { Tron } from "@/components/1_atoms/coin/Tron";
import { Usdc } from "@/components/1_atoms/coin/Usdc";
import { ProposalPrice } from "@/components/2_molecules/ProposalPrice";
import Decimal from "decimal.js";
import { map } from "@/helpers/basic";
import clsx from "clsx";
import type { CalculatorWidgetRef } from "@/components/2_molecules/CalculatorWidget";

const PriceWidget = ({
  calculatorRef,
}: {
  calculatorRef: React.RefObject<CalculatorWidgetRef | null>;
}) => {
  const methods = useForm({
    defaultValues: {},
    reValidateMode: "onSubmit",
  });

  const { control } = usePriceProvider();

  const currencyItems = [
    {
      currency: Currency.달러,
      icon: (
        <span className="min-w-8 h-8 text-primary-foreground rounded-full flex items-center justify-center bg-primary text-[16px]">
          $
        </span>
      ),
      from: "구글",
    },
    {
      currency: Currency.테더,
      icon: <Tether className="!min-w-8 !w-8 !h-8" />,
      from: "빗썸",
    },
    {
      currency: Currency.트론,
      icon: <Tron className="min-w-8 w-8 h-8" />,
      from: "빗썸",
    },
    {
      currency: Currency.비트,
      icon: <Bitcoin className="min-w-8 w-8 h-8" />,
      from: "빗썸",
    },
    {
      currency: Currency.이더,
      icon: <Ethereum className="min-w-8 w-8 h-8" />,
      from: "빗썸",
    },
    {
      currency: Currency.USDC,
      icon: <Usdc className="min-w-8 w-8 h-8" />,
      from: "빗썸",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>시세</CardTitle>
      </CardHeader>
      <FormProvider {...methods}>
        <CardContent className="flex flex-col gap-4">
          {map(currencyItems, (item) => (
            <WithUseWatch
              name={[item.currency]}
              control={control}
              key={item.currency}
            >
              {({ [item.currency]: coin }: PriceProviderProps) => {
                return coin?.trade_price ? (
                  <button
                    type="button"
                    className="flex gap-2 items-center h-[32px] text-left"
                    onClick={() => {
                      calculatorRef.current?.updateInputCurrency(item.currency);
                    }}
                  >
                    {item.icon}
                    <span className="flex flex-col justify-between h-full">
                      <p className="">{item.currency}</p>
                      <CardDescription className="text-[10px] leading-none">
                        {item.from}
                      </CardDescription>
                    </span>
                    <ProposalPrice
                      price={new Decimal(coin.trade_price)}
                      margin={null}
                      currency={item.currency}
                      className={clsx(
                        "relative ml-auto flex-col !gap-[2px] h-full justify-between",
                        "[&>p]:text-[16px]",
                        "[&>div]:ml-auto [&>div>p]:text-[11px]"
                      )}
                      usePrice="prev_closing_price"
                    />
                  </button>
                ) : (
                  <></>
                );
              }}
            </WithUseWatch>
          ))}
        </CardContent>
      </FormProvider>
    </Card>
  );
};

export default PriceWidget;
