"use client";

import { useState } from "react";
import clsx from "clsx";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

import { Mail, MapPin } from "lucide-react";
import type { Session } from "next-auth";
import type { tether_category } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";

import { Tether } from "@/components/1_atoms/coin/Tether";
import { Tron } from "@/components/1_atoms/coin/Tron";
import { CircleLight } from "@/components/1_atoms/CircleLight";
import { KYCAuthor } from "@/components/1_atoms/KYCAuthor";
import { ProposalPrice } from "@/components/2_molecules/ProposalPrice";

import {
  AppRoute,
  Currency,
  TetherAddressTypes,
  TetherPriceTypes,
  TetherStatus,
} from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";
import { getTimeDifference } from "@/helpers/basic";
import { decimalToNumber, getDisplayname } from "@/helpers/common";
import { TetherRegionGroups } from "@/components/3_organisms/TetherRegionGroups";
import type {
  AuthProfile,
  TetherPublicWithProfile,
  TetherWithProfile,
} from "@/app/api/tethers/read";

const renderCurrencyIcon = (currency: Currency, className?: string) => {
  if (currency === Currency.테더)
    return (
      <Tether className={clsx("min-w-4 w-4 h-4 inline-block", className)} />
    );
  if (currency === Currency.트론)
    return <Tron className={clsx("min-w-4 w-4 h-4 inline-block", className)} />;
  return <span className="text-xs">{currency}</span>;
};

const getSuccessPercent = (user: AuthProfile | null) => {
  if (user === null) return "0.00";
  const denominator = user.trade_total + user.trade_joined;
  if (denominator === 0 || user.trade_count === 0) return "0.00";
  const percent = (user.trade_count / denominator) * 100;
  if (percent < 0) return "0.00";
  if (percent > 100) return "100.00";
  return percent.toFixed(2);
};

const getActionStyle = (
  tether: TetherPublicWithProfile | TetherWithProfile,
  session: Session | null | undefined
) => {
  const { status, user, trade_type, _count } = tether;
  const isSelf = session?.user?.displayname === user?.profile?.displayname;
  const isInProgress =
    status === TetherStatus.Progress ||
    (status === TetherStatus.Complete && _count.tether_proposals === 0);
  const isComplete =
    status === TetherStatus.Complete && _count.tether_proposals === 1;

  let className = "";
  let label = "";

  if (isInProgress) {
    className =
      "bg-[#FCD535] text-fail-foreground shadow hover:bg-[#FCD535]/90 text-[#202630]";
    label = "거래중";
  } else if (isComplete) {
    label = "거래완료";
  } else if (isSelf) {
    label = "상세보기";
  } else if (trade_type === "buy") {
    className = "bg-fail text-primary-foreground shadow hover:bg-fail/90";
    label = "판매하기";
  } else {
    className = "bg-success text-primary-foreground shadow hover:bg-success/90";
    label = "구매하기";
  }

  return { className, label, isInProgress };
};

const StatusPill = ({ status }: { status: TetherStatus | string }) => {
  if (status === TetherStatus.Progress) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FCD535]/20 text-[#8a6d00] border border-[#FCD535]/40">
        거래중
      </span>
    );
  }
  if (status === TetherStatus.Complete) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
        거래완료
      </span>
    );
  }
  return null;
};

const DirectionPill = ({ tradeType }: { tradeType: string | null }) => {
  if (tradeType === "buy") {
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-fail/10 text-fail border border-fail/20 shrink-0">
        삽니다
      </span>
    );
  }
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 shrink-0">
      팝니다
    </span>
  );
};

export const TetherCard = ({
  tether,
  session,
  categories,
  goDetail,
  selectedParentName,
}: {
  tether: TetherPublicWithProfile | TetherWithProfile;
  session: Session | null | undefined;
  categories: tether_category[];
  goDetail: (tether: TetherPublicWithProfile) => void;
  selectedParentName?: string | null;
}) => {
  const {
    title,
    currency,
    price,
    margin,
    price_type,
    min_qty,
    max_qty,
    address_type,
    custom_address,
    use_author,
    status,
    trade_type,
    user,
  } = tether;
  const regions = (tether as TetherPublicWithProfile).region_selections ?? [];

  const { toast } = useToast();

  const sendMessage = (displayname: string) => {
    if (!session?.user?.displayname) {
      toast({ id: ToastData.sendMessageNeedLogin, type: "error" });
      return;
    }
    window.open(
      `${AppRoute.MessagePost}?to_uid=${displayname}`,
      "_blank",
      "width=600,height=500,resizable=no,location=no,toolbar=no,menubar=no"
    );
  };

  const action = getActionStyle(tether, session);
  const kycVerified =
    typeof user?.profile?.kyc_id === "string" && user?.profile?.kyc_id !== "";

  const hasRegionZone =
    (address_type === TetherAddressTypes.Category && regions.length > 0) ||
    (address_type === TetherAddressTypes.Custom &&
      typeof custom_address === "string" &&
      custom_address.trim() !== "");

  const userPopup = (
    <Popover>
      <PopoverTrigger
        className="text-blue-500 cursor-pointer text-sm font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        {getDisplayname(user?.profile)}
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-fit flex flex-col gap-1 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => sendMessage(user!.profile!.displayname)}
          disabled={session?.user?.displayname === user?.profile?.displayname}
        >
          <Mail className="w-5 h-5" /> 쪽지 보내기
        </Button>
        <Label className="leading-normal pl-4">
          전체 거래: {user?.trade_total ?? 0}회
        </Label>
        <Label className="leading-normal pl-4">
          완료 거래: {user?.trade_count ?? 0}회
        </Label>
      </PopoverContent>
    </Popover>
  );

  return (
    <article
      className={clsx(
        "group rounded-lg border bg-card text-card-foreground shadow-sm",
        "transition hover:border-primary/40 hover:shadow-md cursor-pointer",
        "p-4 md:p-5 flex flex-col gap-4"
      )}
      onClick={() => goDetail(tether as TetherPublicWithProfile)}
    >
      {/* Header: direction + currency + title + status */}
      <header className="flex items-start gap-2">
        <DirectionPill tradeType={trade_type} />
        {renderCurrencyIcon(currency as Currency, "shrink-0 mt-[2px] w-4 h-4")}
        <h3
          className="font-semibold text-base leading-snug truncate flex-1 min-w-0"
          title={title ?? undefined}
        >
          {title}
        </h3>
        <StatusPill status={status} />
      </header>

      {/* Body: 3-column grid on sm+ (price | region | button), stacked on mobile */}
      <div
        className={clsx(
          "grid gap-4 sm:gap-6 items-stretch grid-cols-1",
          hasRegionZone
            ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"
            : "sm:grid-cols-[minmax(0,1fr)_auto]"
        )}
      >
        {/* Price column */}
        <div className="flex flex-col gap-2 min-w-0">
          {price_type === TetherPriceTypes.Negotiation ? (
            <p className="text-2xl font-semibold">가격협의</p>
          ) : (
            <ProposalPrice
              price={price}
              margin={margin}
              currency={currency as Currency}
            />
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {decimalToNumber(min_qty).toLocaleString()}
            {" ~ "}
            {decimalToNumber(max_qty).toLocaleString()}
            {renderCurrencyIcon(currency as Currency, "ml-1 w-3 h-3")}
          </p>
          {use_author && (
            <KYCAuthor className="[&>p]:text-[11px] shrink-0 self-start" />
          )}
        </div>

        {/* Region column — clicks inside this zone don't trigger card navigation */}
        {hasRegionZone && (
          <div
            className="flex flex-col gap-2 min-w-0 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              거래위치
            </div>
            {address_type === TetherAddressTypes.Category && (
              <TetherRegionGroups
                regions={regions}
                categories={categories}
                selectedParentName={selectedParentName}
              />
            )}
            {address_type === TetherAddressTypes.Custom && (
              <Badge
                variant="outline"
                className="text-xs font-normal py-1 px-2 max-w-full whitespace-normal break-words text-left leading-snug self-start"
              >
                {custom_address}
              </Badge>
            )}
          </div>
        )}

        {/* Action column — fixed-height button, vertically centered */}
        <div className="flex items-center justify-stretch sm:justify-center">
          <Button
            type="button"
            className={clsx(
              "flex gap-2 items-center justify-center px-4 rounded-md h-11",
              "w-full sm:w-auto sm:min-w-[140px]",
              action.className
            )}
            onClick={(e) => {
              e.stopPropagation();
              goDetail(tether as TetherPublicWithProfile);
            }}
          >
            {renderCurrencyIcon(
              currency as Currency,
              action.isInProgress
                ? "!fill-[#202630]"
                : action.label === "상세보기"
                  ? ""
                  : "!fill-primary-foreground"
            )}
            {action.label}
          </Button>
        </div>
      </div>

      {/* Footer: poster meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 border-t text-xs">
        {userPopup}
        <span className="flex items-center gap-1 text-muted-foreground">
          <CircleLight value={kycVerified} />
          KYC 인증
        </span>
        {(user?.trade_count ?? 0) > 0 && (
          <span className="text-muted-foreground">
            성사율 {getSuccessPercent(user)}%
            <span className="text-muted-foreground/70">
              {" "}
              (총 {user?.trade_count}회)
            </span>
          </span>
        )}
        <span className="flex items-center gap-1 text-muted-foreground">
          <CircleLight value={true} />
          마지막 접속:{" "}
          {getTimeDifference(
            true,
            dayjs(user?.last_login).tz("Asia/Seoul").toDate().getTime()
          )}
        </span>
      </div>
    </article>
  );
};
