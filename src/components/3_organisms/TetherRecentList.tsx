"use client";

import type { TetherPublicWithProfile } from "@/app/api/tethers/read";
import { CircleLight } from "@/components/1_atoms/CircleLight";
import { Tether } from "@/components/1_atoms/coin/Tether";
import { Tron } from "@/components/1_atoms/coin/Tron";
import { ProposalPrice } from "@/components/2_molecules/ProposalPrice";
import { Button } from "@/components/ui/button";
import { getTimeDifference } from "@/helpers/basic";
import { decimalToNumber, getDisplayname } from "@/helpers/common";
import { useTetherGoDetail } from "@/helpers/customHook/useTetherGoDetail";
import {
  AppRoute,
  Currency,
  QueryKey,
  TetherPriceTypes,
  TetherStatus,
} from "@/helpers/types";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { RefreshCw, Repeat, CircleCheckBig } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Session } from "next-auth";
import Link from "next/link";

dayjs.extend(utc);
dayjs.extend(timezone);

const getCurrency = (currency: Currency, className?: string) => {
  if (currency === Currency.테더)
    return (
      <Tether className={clsx("min-w-4 w-4 h-4 inline-block", className)} />
    );
  if (currency === Currency.트론)
    return <Tron className={clsx("min-w-4 w-4 h-4 inline-block", className)} />;
  return <span className="text-xs">{currency}</span>;
};

const getSuccessPercent = (user: TetherPublicWithProfile["user"]) => {
  if (!user) return "0.00";
  const denominator = user.trade_total + user.trade_joined;
  if (denominator === 0 || user.trade_count === 0) return "0.00";
  const percent = (user.trade_count / denominator) * 100;
  if (percent < 0) return "0.00";
  if (percent > 100) return "100.00";
  return percent.toFixed(2);
};

const getButtonStyle = (
  item: TetherPublicWithProfile,
  session: Session | null | undefined
) => {
  const { status, user, trade_type, _count } = item;

  if (
    status === TetherStatus.Progress ||
    (status === TetherStatus.Complete && _count.tether_proposals === 0)
  ) {
    return {
      label: "거래",
      className:
        "bg-[#FCD535] text-[#202630] hover:bg-[#FCD535]/90 shadow text-xs px-3",
    };
  }

  if (status === TetherStatus.Complete && _count.tether_proposals === 1) {
    return {
      label: "완료",
      className: "text-xs px-3",
    };
  }

  if (session?.user?.displayname === user?.profile?.displayname) {
    return {
      label: "상세",
      className: "text-xs px-3",
    };
  }

  return trade_type === "buy"
    ? {
        label: "판매",
        className:
          "bg-fail text-primary-foreground hover:bg-fail/90 shadow text-xs px-3",
      }
    : {
        label: "구매",
        className:
          "bg-success text-primary-foreground hover:bg-success/90 shadow text-xs px-3",
      };
};

export const TetherRecentList = ({
  session,
  tethers,
}: {
  session: Session | null | undefined;
  tethers: TetherPublicWithProfile[] | undefined;
}) => {
  const queryClient = useQueryClient();
  const { goDetail, passwordModal } = useTetherGoDetail(session);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [QueryKey.summaryThreads] });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">실시간 거래</h2>
        <button
          type="button"
          onClick={handleRefresh}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="새로고침"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y flex-1">
        {(tethers ?? []).slice(0, 5).map((item) => {
          const {
            id,
            currency,
            title,
            user,
            price_type,
            price,
            margin,
            min_qty,
            max_qty,
          } = item;
          const { label, className: btnClass } = getButtonStyle(item, session);
          const displayname = getDisplayname(user?.profile);
          const hasKyc =
            typeof user?.profile?.kyc_id === "string" &&
            user.profile.kyc_id !== "";

          return (
            <div
              key={id}
              className="flex-1 flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/40 transition-colors px-1 rounded max-h-[calc(100%/5)]"
              onClick={() => goDetail(item)}
            >
              {/* Left: info */}
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">
                  {getCurrency(currency as Currency)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate leading-snug">
                    {title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap overflow-hidden">
                    <span className="text-xs text-blue-500 truncate max-w-[80px]">
                      {displayname}
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground shrink-0">
                      <CircleLight value={hasKyc} />
                      KYC
                    </span>
                    {(user?.trade_count ?? 0) > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground border rounded px-1 py-0.5 leading-none cursor-default">
                                <Repeat className="w-2.5 h-2.5" />
                                {user?.trade_count}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              총 거래 {user?.trade_count}회
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground border rounded px-1 py-0.5 leading-none cursor-default">
                                <CircleCheckBig className="w-2.5 h-2.5" />
                                {getSuccessPercent(user)}%
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              성사율 {getSuccessPercent(user)}%
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-0.5 flex-wrap overflow-hidden">
                    {price_type === TetherPriceTypes.Negotiation ? (
                      <span className="text-xs text-muted-foreground">
                        가격협의
                      </span>
                    ) : (
                      <ProposalPrice
                        price={price}
                        margin={margin}
                        currency={currency as Currency}
                        className="!text-xs [&_p]:!text-xs [&_p]:!leading-snug [&_p]:!whitespace-nowrap"
                      />
                    )}
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {decimalToNumber(min_qty).toLocaleString()}~
                      {decimalToNumber(max_qty).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {/* Right: action button */}
              <Button
                type="button"
                size="sm"
                className={clsx(
                  "shrink-0 h-7 rounded-[5px] flex items-center gap-1",
                  btnClass
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  goDetail(item);
                }}
              >
                {getCurrency(
                  currency as Currency,
                  label === "거래중"
                    ? "!fill-[#202630]"
                    : "!fill-primary-foreground"
                )}
                {label}
              </Button>
            </div>
          );
        })}
        {(tethers ?? []).length < 5 && (
          <div className="flex-1 flex items-center justify-center px-1">
            <span className="text-xs text-muted-foreground">거래 없음</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t gap-2">
        <Link href={AppRoute.Tether} className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 text-sm"
          >
            더보기 ▼
          </Button>
        </Link>
        <Link href={`${AppRoute.Tether}/edit/0`} className="flex-1">
          <Button
            type="button"
            className="w-full h-9 text-sm bg-success text-primary-foreground hover:bg-success/90"
          >
            거래 생성
          </Button>
        </Link>
      </div>

      {passwordModal}
    </div>
  );
};
