"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import {
  type PriceProviderProps,
  usePriceProvider,
} from "@/helpers/customHook/usePriceProvider";
import { Currency } from "@/helpers/types";
import { Tether } from "@/components/1_atoms/coin/Tether";
import { Tron } from "@/components/1_atoms/coin/Tron";
import { Bitcoin } from "@/components/1_atoms/coin/Bitcoin";
import { Ethereum } from "@/components/1_atoms/coin/Ethereum";
import { Usdc } from "@/components/1_atoms/coin/Usdc";
import { Triangle, ChevronUp } from "lucide-react";

const currencies = [
  {
    currency: Currency.달러,
    label: "USD",
    icon: (
      <span className="w-5 h-5 text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center bg-primary shrink-0">
        $
      </span>
    ),
    from: "구글",
  },
  {
    currency: Currency.테더,
    label: "USDT",
    icon: <Tether className="!w-5 !h-5 shrink-0" />,
    from: "빗썸",
  },
  {
    currency: Currency.트론,
    label: "TRX",
    icon: <Tron className="w-5 h-5 shrink-0" />,
    from: "빗썸",
  },
  {
    currency: Currency.비트,
    label: "BTC",
    icon: <Bitcoin className="w-5 h-5 shrink-0" />,
    from: "빗썸",
  },
  {
    currency: Currency.이더,
    label: "ETH",
    icon: <Ethereum className="w-5 h-5 shrink-0" />,
    from: "빗썸",
  },
  {
    currency: Currency.USDC,
    label: "USDC",
    icon: <Usdc className="w-5 h-5 shrink-0" />,
    from: "빗썸",
  },
];

const PriceItem = ({
  currency,
  label,
  icon,
  from,
}: (typeof currencies)[number]) => {
  const { control } = usePriceProvider();
  const coin = useWatch({
    control,
    name: currency as keyof PriceProviderProps,
  });

  if (!coin?.trade_price) return null;

  const price = Number(coin.trade_price);
  const prev = Number(coin.prev_closing_price || price);
  const diff = prev !== 0 ? ((price - prev) / prev) * 100 : 0;
  const isUp = diff >= 0;

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      {icon}
      <span className="text-[11px] font-semibold">{label}</span>
      <span className="text-[11px]">{price.toLocaleString()}</span>
      <span className="flex items-center gap-0.5">
        <Triangle
          className={`w-2 h-2 ${
            isUp
              ? "fill-red-500 stroke-none"
              : "fill-blue-500 stroke-none rotate-180"
          }`}
        />
        <span
          className={`text-[10px] font-medium ${
            isUp ? "text-red-500" : "text-blue-500"
          }`}
        >
          {Math.abs(diff).toFixed(2)}%
        </span>
      </span>
      <span className="text-[9px] text-muted-foreground">· {from}</span>
    </div>
  );
};

export const NavPriceTicker = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // The ticker depends on WebSocket-pushed prices that arrive after hydration.
  // Without this gate, the server renders an empty ticker but the client may
  // render a populated one (if a WS push lands during hydration), causing a
  // hydration mismatch. Defer the price-dependent JSX until after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { control } = usePriceProvider();
  const priceValues = useWatch({ control }) as Partial<PriceProviderProps>;

  const availableCurrencies = mounted
    ? currencies.filter(
        (c) =>
          !!priceValues?.[c.currency as keyof PriceProviderProps]?.trade_price
      )
    : [];
  const count = availableCurrencies.length;
  const effectiveIndex = count > 0 ? activeIndex % count : 0;

  useEffect(() => {
    if (expanded || count === 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 4000);
    return () => clearInterval(timer);
  }, [expanded, count]);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <div ref={panelRef} className="relative">
      {/* Collapsed: single rotating ticker */}
      <button
        type="button"
        onClick={toggle}
        className="relative h-8 w-full flex items-center justify-center overflow-hidden rounded-full border bg-muted/30 px-3 cursor-pointer"
      >
        {availableCurrencies.map((item, i) => (
          <div
            key={item.label}
            className="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out"
            style={{
              opacity: !expanded && i === effectiveIndex ? 1 : 0,
              transform: `translateY(${!expanded && i === effectiveIndex ? 0 : 8}px)`,
              pointerEvents:
                !expanded && i === effectiveIndex ? "auto" : "none",
            }}
          >
            <PriceItem {...item} />
          </div>
        ))}
        {expanded && (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded: all prices dropdown */}
      {expanded && count > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border bg-popover shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex flex-col divide-y">
            {availableCurrencies.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-center py-2 px-3 hover:bg-muted/40 transition-colors"
              >
                <PriceItem {...item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
