import {
  type PriceProviderProps,
  usePriceProvider,
} from "@/helpers/customHook/usePriceProvider";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { Triangle } from "lucide-react";
import { decimalToNumber } from "@/helpers/common";
import type Decimal from "decimal.js";
import clsx from "clsx";
import { Input } from "@/components/ui/input";
import type { Currency } from "@/helpers/types";
import type { TetherKrwRate } from "@/app/api/currency/tether/route";

export const ProposalPrice = ({
  price,
  margin,
  currency,
  className,
  useInput,
  usePrice = "trade_price",
}: {
  price: Decimal | null;
  margin: Decimal | null;
  currency: Currency;
  className?: string;
  useInput?: boolean;
  usePrice?: keyof TetherKrwRate;
}) => {
  const { control } = usePriceProvider();

  const wonWidget = <b className="font-semibold">원</b>;

  const calculateDiffPercent = (target: number) => (
    <WithUseWatch name={[currency]} control={control}>
      {(props: PriceProviderProps) => {
        let price = props[currency][usePrice];
        if (price === "") {
          price = target.toString();
        }
        const diff = target - Number(price);
        const percent = (diff / Number(price)) * 100;
        if (percent > 0) {
          return (
            <div className="flex items-center gap-1">
              <Triangle className="w-[10px] h-[10px] fill-red-500 stroke-none" />
              <p className="text-red-500 font-semibold">
                {percent.toFixed(2)}%
              </p>
            </div>
          );
        } else if (percent < 0) {
          return (
            <div className="flex items-center gap-1">
              <Triangle className="w-[10px] h-[10px] fill-blue-500 stroke-none rotate-180" />
              <p className="text-blue-500 font-semibold">
                {percent.toFixed(2)}%
              </p>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <Triangle className="w-[10px] h-[10px] fill-red-500 stroke-none" />
            <p className="text-red-500 font-semibold">0.00%</p>
          </div>
        );
      }}
    </WithUseWatch>
  );

  const calculateDiffPrice = (target: number) => (
    <WithUseWatch name={[currency]} control={control}>
      {(props: PriceProviderProps) => {
        let price = props[currency][usePrice];
        if (price === "") {
          price = target.toString();
        }
        const diff = Number(price) + (Number(price) * target) / 100;
        return useInput ? (
          <Input value={diff.toLocaleString()} readOnly />
        ) : (
          <p className="text-[20px] whitespace-nowrap">
            {diff.toLocaleString()} {wonWidget}
          </p>
        );
      }}
    </WithUseWatch>
  );

  return (
    <>
      {useInput && (
        <>
          {price && (
            <div className="relative w-full">
              <Input readOnly value={decimalToNumber(price).toLocaleString()} />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 whitespace-nowrap [&>b]:!font-normal [&>b]:!text-sm">
                {calculateDiffPercent(decimalToNumber(price))} {wonWidget}
              </div>
            </div>
          )}
          {margin && (
            <div className="relative w-full">
              {calculateDiffPrice(
                Number(decimalToNumber(margin).toLocaleString())
              )}

              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-4">
                <div className="flex items-center gap-1">
                  <Triangle className="w-[10px] h-[10px] fill-red-500 stroke-none" />
                  <b className="text-red-500 font-normal">
                    {decimalToNumber(margin).toFixed(2)}%
                  </b>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {!useInput && (
        <>
          {price && (
            <div
              className={clsx(
                "flex items-center gap-2 font-semibold flex-wrap",
                className
              )}
            >
              <p className="text-[20px] whitespace-nowrap">
                {decimalToNumber(price).toLocaleString()} {wonWidget}
              </p>
              {calculateDiffPercent(decimalToNumber(price))}
            </div>
          )}

          {margin && (
            <div
              className={clsx(
                "flex items-center gap-2 font-semibold flex-wrap",
                className
              )}
            >
              {calculateDiffPrice(
                Number(decimalToNumber(margin).toLocaleString())
              )}

              <div className="flex items-center gap-1">
                <Triangle className="w-[10px] h-[10px] fill-red-500 stroke-none" />
                <b className="text-red-500 font-semibold">
                  {decimalToNumber(margin).toFixed(2)}%
                </b>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
