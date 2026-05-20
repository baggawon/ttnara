"use client";

import { FormProvider, useForm } from "react-hook-form";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import { forEach, map } from "@/helpers/basic";
import clsx from "clsx";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { Check, RefreshCcw, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { usePathname, useRouter } from "next/navigation";
import {
  ApiRoute,
  AppRoute,
  Currency,
  QueryKey,
  TetherAddressTypes,
  TetherCategories,
  TetherOrderby,
  TetherPriceTypes,
  TetherProposalMessengerTypes,
  TetherRange,
  TetherStatus,
} from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import type {
  TetherListResponse,
  TethersReadProps,
} from "@/app/api/tethers/read";
import { sessionGet, tethersGet } from "@/helpers/get";
import type { Session } from "next-auth";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { TetherCard } from "@/components/3_organisms/TetherCard";
import { GnuboardPaginationSSR } from "@/components/2_molecules/Table/GnuboardPaginationSSR";
import { useTetherGoDetail } from "@/helpers/customHook/useTetherGoDetail";
import { admins, searchItems } from "@/helpers/config";
import { Card, CardHeader } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { postJson } from "@/helpers/common";
import { useQueryClient } from "@tanstack/react-query";
import type { TetherUpdateProps } from "@/app/api/tethers/update";

import Decimal from "decimal.js";

export const TetherCardList = ({
  page,
  pageSize,
  category_name,
  tether_id,
  currency,
  orderby,
  status,
  range,
  region,
  search,
  column,
}: {
  page?: number;
  pageSize?: number;
  category_name?: string;
  currency?: Currency;
  tether_id?: number;
  orderby?: TetherOrderby;
  status?: TetherStatus;
  range?: TetherRange;
  region?: string;
  search?: string;
  column?: string;
}) => {
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    {
      queryKey: [QueryKey.session],
    },
    sessionGet
  );

  const canWrite = session?.user !== null && session?.user !== undefined;
  const isAdmin = session?.user?.auth && admins.includes(session.user.auth);
  const queryClient = useQueryClient();
  const [isMockGenerating, setIsMockGenerating] = useState(false);

  const generateMockTethers = async () => {
    const input = window.prompt("생성할 테스트 거래 수를 입력하세요", "5");
    if (!input) return;
    const count = parseInt(input, 10);
    if (isNaN(count) || count < 1 || count > 100) {
      alert("1~100 사이의 숫자를 입력해주세요.");
      return;
    }

    setIsMockGenerating(true);
    try {
      const tradeTypes = ["buy", "sell"];
      const currencies = [Currency.테더, Currency.트론];
      const preferredTimes = [
        "평일 저녁 7시 이후",
        "주말 오전",
        "언제든",
        "평일 점심",
      ];
      const customAddresses = [
        "서울 강남구 테헤란로",
        "부산 해운대구",
        "인천공항 근처",
        "대전 둔산동",
      ];
      const categories = (tethersData?.tether_categories ?? []).filter(
        (c) => c.is_active
      );

      const pickN = <T,>(arr: T[], n: number): T[] => {
        if (arr.length === 0) return [];
        const pool = [...arr];
        const out: T[] = [];
        const take = Math.min(n, pool.length);
        for (let i = 0; i < take; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          out.push(pool.splice(idx, 1)[0]);
        }
        return out;
      };
      const pickOne = <T,>(arr: T[]): T =>
        arr[Math.floor(Math.random() * arr.length)];

      for (let i = 0; i < count; i++) {
        const tradeType = pickOne(tradeTypes);
        const currency = pickOne(currencies);
        const priceValue = Math.floor(Math.random() * 900 + 100);
        const minQty = Math.floor(Math.random() * 50 + 10);
        const maxQty = minQty + Math.floor(Math.random() * 200 + 50);

        const isNegotiation = Math.random() < 0.3;
        const isCustomAddress = categories.length === 0 || Math.random() < 0.2;
        const hideContact = Math.random() < 0.5;

        const regionIds = isCustomAddress
          ? []
          : pickN(categories, 1 + Math.floor(Math.random() * 3)).map(
              (c) => c.id
            );

        const mockData: TetherUpdateProps = {
          id: 0,
          user_id: "",
          title: `[테스트] 모의 거래 #${i + 1} - 실제 거래 아님`,
          condition:
            "<p>[⚠️ 테스트 데이터] 자동 생성된 모의 거래입니다. 실제 거래가 아닙니다.</p>",
          condition_format: "html",
          use_author: false,
          price: isNegotiation ? null : new Decimal(priceValue),
          margin: null,
          min_qty: new Decimal(minQty),
          max_qty: new Decimal(maxQty),
          trade_type: tradeType,
          price_type: isNegotiation
            ? TetherPriceTypes.Negotiation
            : TetherPriceTypes.Fixed,
          address_type: isCustomAddress
            ? TetherAddressTypes.Custom
            : TetherAddressTypes.Category,
          custom_address: isCustomAddress
            ? `${pickOne(customAddresses)} ${Math.floor(Math.random() * 200 + 1)}번지`
            : null,
          currency,
          status: TetherStatus.Open,
          contact_method: hideContact
            ? null
            : pickOne([
                TetherProposalMessengerTypes.Telegram,
                TetherProposalMessengerTypes.KakaoTalk,
              ]),
          contact_id: hideContact
            ? null
            : `user_${Math.random().toString(36).slice(2, 8)}`,
          preferred_time: hideContact ? null : pickOne(preferredTimes),
          hide_contact: hideContact,
          created_at: new Date(),
          updated_at: new Date(),
          user: null,
          tether_proposals: [],
          region_category_ids: regionIds,
        };

        await postJson<TetherUpdateProps>(ApiRoute.tethersUpdate, mockData);
      }

      queryClient.invalidateQueries({ queryKey: [QueryKey.tethers] });
      alert(`테스트 거래 ${count}건이 생성되었습니다.`);
    } catch {
      alert("테스트 거래 생성 중 오류가 발생했습니다.");
    } finally {
      setIsMockGenerating(false);
    }
  };

  const pagination: TethersReadProps = {
    page: 1,
    pageSize: 20,
    range: TetherRange.Total,
    orderby: TetherOrderby.PriceCheap,
    status: TetherStatus.Open,
    ...(page && { page }),
    ...(pageSize && { pageSize }),
    ...(currency && { currency }),
    ...(category_name && { category_name }),
    ...(orderby && { orderby }),
    ...(typeof tether_id === "number" && { tether_id }),
    ...(status && { status }),
    ...(range && { range }),
    ...(region && { region }),
    ...(search && { search }),
    ...(column && { column }),
  };

  const [tetherDataInterval, setTetherDataInterval] = useState<number>(0);
  const { data: tethersData } = useGetQuery<
    TetherListResponse,
    TethersReadProps
  >(
    {
      queryKey: [{ [QueryKey.tethers]: pagination }],
      refetchInterval: tetherDataInterval * 1000,
    },
    tethersGet,
    pagination
  );

  const methods = useForm<TethersReadProps>({
    defaultValues: {
      ...pagination,
      search: pagination.search ?? "",
      column: pagination.column ?? "title",
      category_name: pagination.category_name ?? "total",
      currency: (pagination.currency as Currency) ?? Currency.원화,
      orderby: pagination.orderby ?? TetherOrderby.PriceCheap,
      status: pagination.status ?? TetherStatus.Open,
      range: pagination.range ?? TetherRange.Total,
      region: pagination.region ?? "total",
    },
    reValidateMode: "onSubmit",
  });

  useEffectFunctionHook({
    Function: () => methods.setValue("category_name", category_name ?? "total"),
    dependency: [category_name],
  });
  useEffectFunctionHook({
    Function: () => {
      if (currency) methods.setValue("currency", currency);
    },
    dependency: [currency],
  });
  const pathname = usePathname();

  const updatePagination = () => {
    const prevProps = methods.getValues();
    const newProps = {
      page: Number(prevProps.page),
      pageSize: Number(prevProps.pageSize),
      search: prevProps.search === "" ? undefined : prevProps.search,
      category_name:
        prevProps.category_name === "total"
          ? undefined
          : prevProps.category_name,
      ...(prevProps.search !== "" && {
        column: prevProps.column,
      }),
      ...(typeof tether_id === "number" && { tether_id }),
      currency: prevProps.currency,
      orderby: prevProps.orderby,
      status: prevProps.status,
      range: prevProps.range,
      region: prevProps.region === "total" ? undefined : prevProps.region,
    };
    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete (newProps as any)[key];
    });

    router.push(
      `${pathname}?${new URLSearchParams(newProps as any).toString()}`
    );
  };

  const selectCategory = (category_name: string) => {
    methods.setValue("category_name", category_name);
    updatePagination();
  };

  const selectCurrency = (currency: Currency) => {
    methods.setValue("currency", currency);
    updatePagination();
  };

  const selectStatus = (status: TetherStatus) => {
    methods.setValue("status", status);
    updatePagination();
  };

  const selectRange = (range: TetherRange) => {
    methods.setValue("range", range);
    updatePagination();
  };

  const selectRegion = (region: string) => {
    methods.setValue("region", region);
    updatePagination();
  };

  const selectOrderby = (orderby: TetherOrderby) => {
    methods.setValue("orderby", orderby);
    updatePagination();
  };

  const router = useRouter();

  const goWrite = () => {
    router.push(`${AppRoute.Threads}/tether/edit/0`);
  };

  const { goDetail, passwordModal } = useTetherGoDetail(session);
  const tethers = tethersData?.tethers ?? [];
  const categories = tethersData?.tether_categories ?? [];
  const selectedParentName = region && region !== "total" ? region : null;

  return (
    <div className="w-full flex flex-col gap-4">
      <Card>
        <FormProvider {...methods}>
          <CardHeader>
            <WithUseWatch name={["category_name"]}>
              {({ category_name }: TethersReadProps) => (
                <Tabs
                  value={category_name}
                  onValueChange={selectCategory}
                  className="w-full flex gap-4 flex-wrap"
                >
                  <TabsList>
                    <TabsTrigger value={TetherCategories.Total}>
                      전체
                    </TabsTrigger>
                    <TabsTrigger value={TetherCategories.Buy}>
                      삽니다
                    </TabsTrigger>
                    <TabsTrigger value={TetherCategories.Sell}>
                      팝니다
                    </TabsTrigger>
                  </TabsList>
                  <ToggleGroupInput
                    name="currency"
                    variant="outline"
                    className={clsx(
                      "gap-0",
                      "[&>button]:border-0 [&>button]:shadow-none [&>button[aria-checked='false']]:opacity-50 [&>button[aria-checked='true']]:bg-transparent [&>button[aria-checked='true']]:font-bold"
                    )}
                    orientation="horizontal"
                    onValueChange={selectCurrency}
                  >
                    {map(
                      [
                        { label: "테더", value: Currency.테더 },
                        { label: "트론", value: Currency.트론 },
                      ],
                      ({ label, value }) => (
                        <ToggleGroupItem
                          value={value}
                          aria-label={label}
                          key={value}
                        >
                          {label}
                        </ToggleGroupItem>
                      )
                    )}
                  </ToggleGroupInput>
                  <div className="ml-auto flex gap-1.5 items-center flex-wrap">
                    <SelectInput
                      name="range"
                      onChange={selectRange}
                      buttonClassName="!w-fit h-8 px-2 text-xs"
                      items={[
                        {
                          value: TetherRange.Total,
                          label: "전체",
                        },
                        {
                          value: TetherRange.In24Hours,
                          label: "오늘",
                        },
                        {
                          value: TetherRange.InOneWeek,
                          label: "이번주",
                        },
                        {
                          value: TetherRange.InOneMonth,
                          label: "이번달",
                        },
                      ]}
                    />
                    <SelectInput
                      name="status"
                      onChange={selectStatus}
                      buttonClassName="!w-fit h-8 px-2 text-xs"
                      items={[
                        {
                          value: TetherStatus.Open,
                          label: "거래가능",
                        },
                        {
                          value: TetherStatus.Progress,
                          label: "거래중",
                        },
                        {
                          value: TetherStatus.Complete,
                          label: "거래완료",
                        },
                      ]}
                    />
                    <SelectInput
                      name="region"
                      onChange={selectRegion}
                      buttonClassName="!w-fit h-8 px-2 text-xs"
                      items={[
                        { value: "total", label: "전체 지역" },
                        ...(tethersData?.tether_categories ?? [])
                          .filter((c) => c.parent_id === null && c.is_active)
                          .map((c) => ({
                            value: c.name,
                            label: c.name,
                          })),
                      ]}
                    />
                    <SelectInput
                      name="orderby"
                      onChange={selectOrderby}
                      buttonClassName="!w-fit h-8 px-2 text-xs"
                      items={[
                        {
                          value: TetherOrderby.PriceCheap,
                          label: "낮은 가격순",
                        },
                        {
                          value: TetherOrderby.PriceExpensive,
                          label: "높은 가격순",
                        },
                        {
                          value: TetherOrderby.GoodTrader,
                          label: "우수거래자순",
                        },
                      ]}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          type="button"
                          className="h-8 w-8"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-fit flex flex-col">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setTetherDataInterval(0)}
                          className={clsx(
                            tetherDataInterval !== 0 && "opacity-50"
                          )}
                        >
                          {tetherDataInterval === 0 && (
                            <Check className="w-4 h-4" />
                          )}
                          새로고침 없음
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setTetherDataInterval(10)}
                          className={clsx(
                            tetherDataInterval !== 10 && "opacity-50"
                          )}
                        >
                          {tetherDataInterval === 10 && (
                            <Check className="w-4 h-4" />
                          )}
                          10초마다
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setTetherDataInterval(20)}
                          className={clsx(
                            tetherDataInterval !== 20 && "opacity-50"
                          )}
                        >
                          {tetherDataInterval === 20 && (
                            <Check className="w-4 h-4" />
                          )}
                          20초마다
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setTetherDataInterval(30)}
                          className={clsx(
                            tetherDataInterval !== 30 && "opacity-50"
                          )}
                        >
                          {tetherDataInterval === 30 && (
                            <Check className="w-4 h-4" />
                          )}
                          30초마다
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                </Tabs>
              )}
            </WithUseWatch>
          </CardHeader>
          <CardContent className="w-full flex flex-col gap-4">
            <section className="flex flex-col gap-3">
              {tethers.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">
                  게시글이 없습니다.
                </p>
              ) : (
                tethers.map((tether) => (
                  <TetherCard
                    key={tether.id}
                    tether={tether}
                    session={session}
                    categories={categories}
                    goDetail={goDetail}
                    selectedParentName={selectedParentName}
                  />
                ))
              )}
              <GnuboardPaginationSSR
                pagination={tethersData?.pagination}
                useRowSelect={false}
                setPageIndexAction={(index) => {
                  methods.setValue("page", index);
                  updatePagination();
                }}
              />
            </section>
            <div className="flex justify-center gap-4 w-full">
              <SelectInput
                name="column"
                items={searchItems}
                buttonClassName="!w-full sm:!w-[150px]"
                buttonWrapClassName="w-full sm:w-fit"
              />
              <div className="relative w-full sm:w-[228px]">
                <Input
                  name="search"
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updatePagination();
                    }
                  }}
                />
                <button
                  onClick={updatePagination}
                  className="absolute top-1/2 right-4 -translate-y-1/2"
                >
                  <SearchIcon width={20} height={20} />
                </button>
              </div>
              {canWrite && (
                <Button type="button" onClick={goWrite}>
                  거래생성
                </Button>
              )}
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateMockTethers}
                  disabled={isMockGenerating}
                >
                  {isMockGenerating ? "생성중..." : "테스트 생성"}
                </Button>
              )}
            </div>
          </CardContent>
        </FormProvider>
      </Card>
      {passwordModal}
    </div>
  );
};
