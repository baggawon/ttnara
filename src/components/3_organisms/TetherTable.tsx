"use client";

import { forEach, getTimeDifference } from "@/helpers/basic";
import clsx from "clsx";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AppRoute,
  Currency,
  type PaginationInfo,
  TetherAddressTypes,
  TetherMethods,
  TetherPriceTypes,
  TetherStatus,
} from "@/helpers/types";
import type {
  AuthProfile,
  TetherPublicWithProfile,
  TetherWithProfile,
} from "@/app/api/tethers/read";
import type { Session } from "next-auth";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { useTetherGoDetail } from "@/helpers/customHook/useTetherGoDetail";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { setDefaultColumn } from "@/helpers/makeComponent";
import {
  decimalToNumber,
  getColumnHeaderTitle,
  getDisplayname,
} from "@/helpers/common";
import {
  DataTableSSR,
  type SSrTableRef,
} from "@/components/2_molecules/Table/DataTableSSR";
import { Tether } from "@/components/1_atoms/coin/Tether";
import { Tron } from "@/components/1_atoms/coin/Tron";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { ToastData } from "@/helpers/toastData";
import { ProposalPrice } from "@/components/2_molecules/ProposalPrice";
import { FreeTrade } from "@/components/1_atoms/FreeTrade";
import { PromiseTransaction } from "@/components/1_atoms/PromiseTransaction";
import { useIsMobile } from "@/helpers/customHook/useWindowSize";
import { useRef } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { Label } from "@/components/ui/label";
import { CircleLight } from "@/components/1_atoms/CircleLight";
import { KYCAuthor } from "@/components/1_atoms/KYCAuthor";

export const TetherTable = ({
  session,
  pagination,
  tethers,
  setPageIndexAction,
}: {
  session: Session | null | undefined;
  pagination?: PaginationInfo | undefined;
  tethers: TetherPublicWithProfile[] | TetherWithProfile[] | undefined;
  setPageIndexAction: (index: number) => void;
}) => {
  const getCurrency = (currency: Currency, className?: string) => {
    if (currency === Currency.테더)
      return (
        <Tether
          className={clsx("min-w-5 w-5 h-5 inline-block mr-2", className)}
        />
      );
    if (currency === Currency.트론)
      return (
        <Tron
          className={clsx("min-w-5 w-5 h-5 inline-block mr-2", className)}
        />
      );
    return <>{currency}</>;
  };

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

  const isMobile = useIsMobile(768);

  const getStateFunction = (
    props: TetherWithProfile | TetherPublicWithProfile
  ) => {
    const { status, user, trade_type, _count } = props;

    const getButtonColor = () => {
      if (
        status === TetherStatus.Progress ||
        (status === TetherStatus.Complete && _count.tether_proposals === 0)
      )
        return "bg-[#FCD535] text-fail-foreground shadow hover:bg-[#FCD535]/90 text-[#202630]";
      if (status === TetherStatus.Complete && _count.tether_proposals === 1) {
        return "";
      }

      if (session?.user?.displayname === user?.profile?.displayname) return "";

      return trade_type === "buy"
        ? "bg-fail text-primary-foreground shadow hover:bg-fail/90"
        : "bg-success text-primary-foreground shadow hover:bg-success/90";
    };

    const getButtonLabel = () => {
      if (
        status === TetherStatus.Progress ||
        (status === TetherStatus.Complete && _count.tether_proposals === 0)
      )
        return "거래중";
      if (status === TetherStatus.Complete && _count.tether_proposals === 1) {
        return "거래완료";
      }

      if (session?.user?.displayname === user?.profile?.displayname)
        return "상세보기";

      return trade_type === "buy" ? "판매하기" : "구매하기";
    };
    return { getButtonColor, getButtonLabel };
  };

  const { goDetail, passwordModal } = useTetherGoDetail(session);

  const getSuccessPercent = (user: AuthProfile | null) => {
    if (user === null) return "0.00";
    if (user.trade_total === 0 || user.trade_count === 0) return "0.00";

    const percent =
      ((user.trade_count - user.trade_cancel) / user.trade_total) * 100;

    if (percent < 0) return "0.00";
    if (percent > 100) return "100.00";

    return percent.toFixed(2);
  };

  const getUserPopup = (user: AuthProfile | null) => {
    return (
      <Popover>
        <PopoverTrigger className="text-blue-500 cursor-pointer">
          {getDisplayname(user?.profile)}
        </PopoverTrigger>
        <PopoverContent className="p-0 w-fit flex flex-col gap-1 pb-2">
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
          <Label className="leading-normal pl-4">
            취소 거래: {user?.trade_cancel ?? 0}회
          </Label>
        </PopoverContent>
      </Popover>
    );
  };

  const columns: CustomColumDef<TetherWithProfile | TetherPublicWithProfile>[] =
    setDefaultColumn([
      {
        accessorKey: "title",
        headerTitle: "판매자 정보",
        header: ({ column }) => getColumnHeaderTitle(column),
        headerClassName: "w-[20%] md:w-[40%]",
        cellClassName: "w-[20%] md:w-[40%]",
        cell: (props) => {
          const { currency, user } = props.row.original;

          return (
            <>
              <span className="flex gap-1 items-center w-full">
                <b
                  className={clsx(
                    "truncate font-normal max-w-[calc(100%-0.005rem)]"
                  )}
                >
                  {getCurrency(currency as Currency)}
                  {props.getValue()}
                </b>
              </span>
              <div className="flex items-end gap-2 mt-2 [&>p]:leading-[140%]">
                {getUserPopup(user)}

                <p className="text-[11px] flex items-center gap-1">
                  <CircleLight
                    value={
                      typeof user?.profile?.kyc_id === "string" &&
                      user?.profile?.kyc_id !== ""
                    }
                  />
                  KYC 인증
                </p>

                {(user?.trade_total ?? 0) > 0 && (
                  <p className="leading-[140%] text-[11px]">
                    총 거래: {user?.trade_total}회, 성사율:
                    {` ${getSuccessPercent(user)}`}%
                  </p>
                )}
              </div>
              <p className="text-[11px] flex items-center gap-1 mt-2">
                <CircleLight value={true} />
                마지막 접속:{" "}
                {getTimeDifference(
                  true,
                  dayjs(user?.last_login).tz("Asia/Seoul").toDate().getTime()
                )}
              </p>
            </>
          );
        },
      },
      {
        accessorKey: "price",
        headerTitle: "가격",
        header: ({ column }) => getColumnHeaderTitle(column),
        cell: (props) => {
          const { price_type, price, margin, currency } = props.row.original;
          return (
            <>
              {price_type === TetherPriceTypes.Negotiation && (
                <p className="text-[20px]">가격협의</p>
              )}
              {price_type !== TetherPriceTypes.Negotiation && (
                <ProposalPrice
                  price={price}
                  margin={margin}
                  currency={currency as Currency}
                />
              )}
            </>
          );
        },
      },
      {
        accessorKey: "method",
        headerTitle: "거래정보",
        header: ({ column }) => getColumnHeaderTitle(column),

        cell: (props) => {
          const {
            methods: method,
            min_qty,
            max_qty,
            address_type,
            city,
            state,
            currency,
            custom_address,
            use_author,
          } = props.row.original;
          return (
            <span className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                {method === TetherMethods.Public && (
                  <FreeTrade className="[&>p]:text-[11px]" />
                )}
                {method === TetherMethods.Promise && (
                  <PromiseTransaction className="[&>p]:text-[11px]" />
                )}
                {use_author && <KYCAuthor className="[&>p]:text-[11px]" />}
              </div>
              <div className="[&>p]:leading-[140%] [&>p]:text-sm block">
                <p>
                  {decimalToNumber(min_qty).toLocaleString()}~
                  {decimalToNumber(max_qty).toLocaleString()}
                  {getCurrency(currency as Currency, "ml-1 !w-3 !h-3 !min-w-3")}
                </p>
              </div>
              {address_type === TetherAddressTypes.Category && (
                <p>
                  {city}
                  {state !== "" && state !== null ? ` ${state}` : ""}
                </p>
              )}
              {address_type === TetherAddressTypes.Custom && (
                <p>{custom_address}</p>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "more",
        headerTitle: "거래",
        header: ({ column }) => getColumnHeaderTitle(column),
        headerClassName: "w-[105px] py-2 px-0",
        cellClassName: "w-[105px] py-2 px-0",
        cell: (props) => {
          const { currency } = props.row.original;

          const { getButtonColor, getButtonLabel } = getStateFunction(
            props.row.original
          );

          return (
            <Button
              type="button"
              className={clsx(
                "flex gap-2 items-center px-0 !w-[105px] rounded-[5px]",
                getButtonColor()
              )}
              onClick={() => goDetail(props.row.original)}
            >
              {getCurrency(
                currency as Currency,
                getButtonLabel() === "거래중"
                  ? "!fill-[#202630]"
                  : "!fill-primary-foreground"
              )}
              {getButtonLabel()}
            </Button>
          );
        },
      },
      {
        accessorKey: "mobile",
        headerTitle: "거래",
        header: ({ column }) => getColumnHeaderTitle(column),

        cell: (props) => {
          const {
            currency,
            user,
            title,
            methods: method,
            min_qty,
            max_qty,
            price_type,
            price,
            margin,
            address_type,
            city,
            state,
            custom_address,
            use_author,
          } = props.row.original;

          const { getButtonColor, getButtonLabel } = getStateFunction(
            props.row.original
          );
          return (
            <div className="flex flex-col gap-2">
              <span className="flex gap-1 items-center w-full justify-between">
                <b
                  className={clsx(
                    "truncate font-normal",
                    method === TetherMethods.Public &&
                      "max-w-[calc(100%-0.25rem-58.04px)]",
                    method === TetherMethods.Promise &&
                      "max-w-[calc(100%-0.25rem-62.04px)]",
                    ![TetherMethods.Public, TetherMethods.Promise].includes(
                      method as TetherMethods
                    ) && "max-w-[calc(100%-0.005rem)]"
                  )}
                >
                  {getCurrency(currency as Currency)}
                  {title}
                </b>
                <div className="flex items-center gap-2">
                  {method === TetherMethods.Public && (
                    <FreeTrade className="[&>p]:text-[11px] whitespace-nowrap" />
                  )}
                  {method === TetherMethods.Promise && (
                    <PromiseTransaction className="[&>p]:text-[11px] whitespace-nowrap" />
                  )}

                  {use_author && <KYCAuthor className="[&>p]:text-[11px]" />}
                </div>
              </span>
              <span className="flex items-center justify-between">
                {price_type === TetherPriceTypes.Negotiation && (
                  <p className="text-[20px]">가격협의</p>
                )}
                {price_type !== TetherPriceTypes.Negotiation && (
                  <ProposalPrice
                    price={price}
                    margin={margin}
                    currency={currency as Currency}
                  />
                )}
                <div className="[&>p]:leading-[140%] [&>p]:text-sm block">
                  <p>
                    {decimalToNumber(min_qty).toLocaleString()}~
                    {decimalToNumber(max_qty).toLocaleString()}
                    {getCurrency(
                      currency as Currency,
                      "ml-1 !w-3 !h-3 !min-w-3 mr-0"
                    )}
                  </p>
                </div>
              </span>

              <span className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  {getUserPopup(user)}
                  {(user?.trade_count ?? 0) > 0 && (
                    <p>성사율 {getSuccessPercent(user)}%</p>
                  )}
                </div>

                {address_type === TetherAddressTypes.Category && (
                  <p>
                    {city}
                    {state !== "" && state !== null ? ` ${state}` : ""}
                  </p>
                )}
                {address_type === TetherAddressTypes.Custom && (
                  <p>{custom_address}</p>
                )}
              </span>
              <div className="flex items-end justify-between gap-2 [&>p]:leading-[140%]">
                <div className="flex flex-col justify-between">
                  <p className="text-[11px] flex items-center gap-1">
                    <CircleLight
                      value={
                        typeof user?.profile?.kyc_id === "string" &&
                        user?.profile?.kyc_id !== ""
                      }
                    />
                    KYC 인증
                  </p>
                  <p className="text-[11px] flex items-center gap-1 mt-2">
                    <CircleLight value={true} />
                    마지막 접속:{" "}
                    {getTimeDifference(
                      true,
                      dayjs(user?.last_login)
                        .tz("Asia/Seoul")
                        .toDate()
                        .getTime()
                    )}
                  </p>
                </div>

                <Button
                  type="button"
                  className={clsx(
                    "flex gap-[2px] items-center px-0 !w-[80px] rounded-[5px] text-xs",
                    getButtonColor()
                  )}
                  onClick={() => goDetail(props.row.original)}
                >
                  {getCurrency(
                    currency as Currency,
                    `${
                      getButtonLabel() === "거래중"
                        ? "!fill-[#202630]"
                        : "!fill-primary-foreground"
                    } !w-4 !h-4 !min-w-4 mr-1`
                  )}
                  {getButtonLabel()}
                </Button>
              </div>
            </div>
          );
        },
      },
    ]);

  const tableRef = useRef<SSrTableRef<
    TetherPublicWithProfile | TetherWithProfile
  > | null>(null);

  useEffectFunctionHook({
    Function: () => {
      const columnVisibility: VisibilityState = {};
      if (isMobile) {
        forEach(columns, (column) => {
          columnVisibility[column.accessorKey!] =
            column.accessorKey === "mobile";
        });
      } else {
        forEach(columns, (column) => {
          columnVisibility[column.accessorKey!] =
            column.accessorKey !== "mobile";
        });
      }
      tableRef.current?.setColumnVisibility(columnVisibility);
    },
    dependency: [isMobile],
  });

  return (
    <>
      <DataTableSSR
        columns={columns}
        data={tethers ?? []}
        tableRef={tableRef}
        placeholder="게시글이 없습니다."
        setPageIndexAction={setPageIndexAction}
        pagination={pagination}
        onRowClassName={() => "cursor-pointer"}
        className={clsx(
          "[&>div]:border-t-0",
          "[&>div>div>table>thead]:bg-transparent",
          "[&>div>div>table>thead>tr>th]:font-light [&>div>div>table>thead>tr>th]:text-xs"
        )}
        useHeader={!isMobile}
      />
      {passwordModal}
    </>
  );
};
