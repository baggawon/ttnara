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
import { useEffect, useState } from "react";
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

  // WebSocket-pushed prices can populate the form before hydration completes,
  // so a row may render on first client render while SSR rendered nothing.
  // Defer the price-dependent JSX until after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const currencyItems = [
    {
      currency: Currency.달러,
      icon: (
        <span className="min-w-6 h-6 text-primary-foreground rounded-full flex items-center justify-center bg-primary text-[12px]">
          $
        </span>
      ),
      from: "구글",
    },
    {
      currency: Currency.테더,
      icon: <Tether className="!min-w-6 !w-6 !h-6" />,
      from: "빗썸",
    },
    {
      currency: Currency.트론,
      icon: <Tron className="min-w-6 w-6 h-6" />,
      from: "빗썸",
    },
    {
      currency: Currency.비트,
      icon: <Bitcoin className="min-w-6 w-6 h-6" />,
      from: "빗썸",
    },
    {
      currency: Currency.이더,
      icon: <Ethereum className="min-w-6 w-6 h-6" />,
      from: "빗썸",
    },
    {
      currency: Currency.USDC,
      icon: <Usdc className="min-w-6 w-6 h-6" />,
      from: "빗썸",
    },
  ];

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">시세</CardTitle>
      </CardHeader>
      <FormProvider {...methods}>
        <CardContent className="flex flex-col gap-2 p-3 pt-0">
          {map(currencyItems, (item) => (
            <WithUseWatch
              name={[item.currency]}
              control={control}
              key={item.currency}
            >
              {({ [item.currency]: coin }: PriceProviderProps) => {
                return mounted && coin?.trade_price ? (
                  <button
                    type="button"
                    className="flex gap-2 items-center h-[28px] text-left"
                    onClick={() => {
                      calculatorRef.current?.updateInputCurrency(item.currency);
                    }}
                  >
                    {item.icon}
                    <span className="flex flex-col justify-between h-full">
                      <p className="text-xs">{item.currency}</p>
                      <CardDescription className="text-[10px] leading-none">
                        {item.from}
                      </CardDescription>
                    </span>
                    <ProposalPrice
                      price={new Decimal(coin.trade_price)}
                      margin={null}
                      currency={item.currency}
                      className={clsx(
                        "relative ml-auto flex-col !gap-[1px] h-full justify-between",
                        "[&>p]:text-[13px]",
                        "[&>div]:ml-auto [&>div>p]:text-[10px]"
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
