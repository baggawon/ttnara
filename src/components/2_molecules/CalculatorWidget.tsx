"use client";

import { FormBuilder, Input } from "@/components/2_molecules/Input/FormInput";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import {
  type PriceProviderProps,
  usePriceProvider,
} from "@/helpers/customHook/usePriceProvider";
import { Currency } from "@/helpers/types";
import { FormProvider, useForm } from "react-hook-form";
import SelectInput from "./Input/Select";
import { Tether } from "@/components/1_atoms/coin/Tether";
import { Tron } from "@/components/1_atoms/coin/Tron";
import { Bitcoin } from "@/components/1_atoms/coin/Bitcoin";
import { Ethereum } from "@/components/1_atoms/coin/Ethereum";
import { Usdc } from "@/components/1_atoms/coin/Usdc";
import { useImperativeHandle, useState } from "react";
import { lazyUpdate } from "@/helpers/common";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface CalculatorWidgetRef {
  updateInputCurrency: (value: Currency) => void;
  updateOutputCurrency: (value: Currency) => void;
}

interface CalculatorWidgetProps {
  prevValue: string;
  tradeOutput: string;
  tradeInput: string;
  inputCurrency: Currency;
  outputCurrency: Currency;
}

const CalculatorWidget = ({
  calculatorRef,
}: {
  calculatorRef: React.RefObject<CalculatorWidgetRef | null>;
}) => {
  useImperativeHandle(calculatorRef, () => ({
    updateInputCurrency,
    updateOutputCurrency,
  }));

  const updateInputCurrency = (value: Currency) => {
    setInputCurrency(value);
    methods.setValue("inputCurrency", value);
  };

  const updateOutputCurrency = (value: Currency) => {
    methods.setValue("outputCurrency", value);
    setOutputCurrency(value);
  };

  const initialValues = (): CalculatorWidgetProps => {
    return {
      prevValue: "",
      tradeOutput: "",
      tradeInput: "",
      inputCurrency: Currency.테더,
      outputCurrency: Currency.원화,
    };
  };

  const methods = useForm({
    defaultValues: initialValues(),
    reValidateMode: "onSubmit",
  });

  const onMessage = (tether: string) => {
    lazyUpdate(() => {
      methods.setValue("prevValue", tether);
      convertMoney(methods.getValues("tradeInput"));
    });
  };

  const convertMoney = (inputValue: string) => {
    const periodIndex = inputValue.indexOf(".");
    const value = Number(parseFloat(inputValue.replaceAll(",", "")).toFixed(8));
    if (!Number.isNaN(value)) {
      getOutputValue();
      if (periodIndex > -1 && !String(value).includes(".")) {
        methods.setValue("tradeInput", `${value.toLocaleString()}.`);
      } else {
        methods.setValue(
          "tradeInput",
          value.toLocaleString("ko-KR", { maximumFractionDigits: 8 })
        );
      }
    } else {
      methods.setValue("tradeOutput", "");
      methods.setValue("tradeInput", "");
    }
  };

  const { control, getValues } = usePriceProvider();

  const getOutputValue = () => {
    const inputValue = Number(
      getValues(methods.getValues("inputCurrency")).trade_price
    );
    const outputValue = Number(
      getValues(methods.getValues("outputCurrency")).trade_price
    );

    const value = Number(
      parseFloat(methods.getValues("tradeInput").replaceAll(",", "")).toFixed(8)
    );
    methods.setValue(
      "tradeOutput",
      ((value * inputValue) / outputValue).toLocaleString("ko-KR", {
        maximumFractionDigits: 8,
      })
    );
  };

  const currencyItems = [
    {
      value: Currency.원화,
      label: (
        <div className="flex gap-2 items-center">
          <span className="min-w-5 h-5 text-primary-foreground rounded-full flex items-center justify-center bg-primary text-[9px]">
            ₩
          </span>
          원화
        </div>
      ),
    },
    {
      value: Currency.테더,
      label: (
        <div className="flex gap-2 items-center">
          <Tether className="min-w-5 w-5 h-5" />
          테더
        </div>
      ),
    },
    {
      value: Currency.트론,
      label: (
        <div className="flex gap-2 items-center">
          <Tron className="min-w-5 w-5 h-5" />
          트론
        </div>
      ),
    },
    {
      value: Currency.비트,
      label: (
        <div className="flex gap-2 items-center">
          <Bitcoin className="min-w-5 w-5 h-5" />
          비트
        </div>
      ),
    },
    {
      value: Currency.이더,
      label: (
        <div className="flex gap-2 items-center">
          <Ethereum className="min-w-5 w-5 h-5" />
          이더
        </div>
      ),
    },
    {
      value: Currency.USDC,
      label: (
        <div className="flex gap-2 items-center">
          <Usdc className="min-w-5 w-5 h-5" />
          Usdc
        </div>
      ),
    },
  ];

  const [inputCurrency, setInputCurrency] = useState<Currency>(Currency.테더);
  const [outputCurrency, setOutputCurrency] = useState<Currency>(Currency.원화);

  return (
    <FormProvider {...methods}>
      <Card className="w-full p-4">
        <CardContent className="flex flex-col gap-4 p-0">
          <WithUseWatch
            name={[inputCurrency, outputCurrency]}
            control={control}
          >
            {(props: PriceProviderProps) => {
              onMessage(props[inputCurrency].trade_price);
              return (
                <>
                  <FormBuilder name="tradeInput" label="수량">
                    <div className="flex gap-2">
                      <Input
                        name="tradeInput"
                        onChange={(e) => convertMoney(e.target.value)}
                        placeholder="수량을 입력하세요."
                      />
                      <SelectInput
                        name="inputCurrency"
                        onChange={(value) =>
                          updateInputCurrency(value as Currency)
                        }
                        items={currencyItems}
                        buttonClassName="!w-fit"
                      />
                    </div>
                  </FormBuilder>
                  <Button
                    type="button"
                    onClick={() => {
                      updateInputCurrency(outputCurrency);
                      updateOutputCurrency(inputCurrency);
                    }}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                  <FormBuilder name="tradeOutput" label="환산금액">
                    <div className="flex gap-2">
                      <Input
                        name="tradeOutput"
                        readOnly
                        className="!opacity-100"
                        inputClassName="w-full"
                      />
                      <SelectInput
                        name="outputCurrency"
                        onChange={(value) =>
                          updateOutputCurrency(value as Currency)
                        }
                        items={currencyItems}
                        buttonClassName="!w-fit"
                      />
                    </div>
                  </FormBuilder>
                </>
              );
            }}
          </WithUseWatch>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

export default CalculatorWidget;
