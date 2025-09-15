"use client";

import type { TetherKrwRate } from "@/app/api/currency/tether/route";
import { useWebSocket } from "@/helpers/customHook/useWebsocket";
import { createContext, useContext } from "react";
import { type Control, useForm, type UseFormGetValues } from "react-hook-form";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { Currency, QueryKey } from "@/helpers/types";
import { tetherKrwRateGet } from "@/helpers/get";
import useEffectFunctionHook from "./useEffectFunction";

export interface PriceProviderProps {
  USD: TetherKrwRate;
  Tether: TetherKrwRate;
  Tron: TetherKrwRate;
  Bitcoin: TetherKrwRate;
  Ethereum: TetherKrwRate;
  UsdCoin: TetherKrwRate;
  KRW: TetherKrwRate;
}

interface WsContextType {
  control: Control<PriceProviderProps, any>;
  getValues: UseFormGetValues<PriceProviderProps>;
}

const PriceContext = createContext<WsContextType | null>(null);

const PriceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { data: tetherKrwRate } = useGetQuery<TetherKrwRate, any>(
    {
      queryKey: [QueryKey.tetherKrwRate],
      refetchInterval: 45 * 1000, // 45초마다 갱신
    },
    tetherKrwRateGet
  );

  useEffectFunctionHook({
    Function: () => {
      if (tetherKrwRate) {
        methods.setValue("USD", tetherKrwRate);
      }
    },
    dependency: [tetherKrwRate],
  });

  const initialValues = (): PriceProviderProps => {
    return {
      USD: {
        prev_closing_price: "",
        trade_price: "",
      },
      Tether: {
        prev_closing_price: "",
        trade_price: "",
      },
      Tron: {
        prev_closing_price: "",
        trade_price: "",
      },
      Bitcoin: {
        prev_closing_price: "",
        trade_price: "",
      },
      Ethereum: {
        prev_closing_price: "",
        trade_price: "",
      },
      UsdCoin: {
        prev_closing_price: "",
        trade_price: "",
      },
      KRW: {
        prev_closing_price: "1",
        trade_price: "1",
      },
    };
  };

  const methods = useForm({
    defaultValues: initialValues(),
    reValidateMode: "onSubmit",
  });

  const onMessage = (webSocketData: any) => {
    if (webSocketData.tp) {
      const trade_price = webSocketData.tp;
      const prev_closing_price = webSocketData.pcp;
      [
        { simbol: Currency.테더, code: "KRW-USDT" },
        { simbol: Currency.트론, code: "KRW-TRX" },
        { simbol: Currency.비트, code: "KRW-BTC" },
        { simbol: Currency.이더, code: "KRW-ETH" },
        { simbol: Currency.USDC, code: "KRW-USDC" },
      ].forEach((item) => {
        if (webSocketData.cd === item.code) {
          if (
            methods.getValues(`${item.simbol}` as any).trade_price !==
            trade_price
          )
            methods.setValue(`${item.simbol}` as any, {
              trade_price: String(trade_price),
              prev_closing_price: String(prev_closing_price),
            });
        }
      });
    }
  };

  useWebSocket({
    onMessage,
  });

  return (
    <PriceContext.Provider value={methods}>{children}</PriceContext.Provider>
  );
};

export default PriceProvider;

export const usePriceProvider = () => {
  const context = useContext(PriceContext);

  if (!context) {
    throw new Error("usePriceProvider must be used within a PriceProvider");
  }
  return context;
};
