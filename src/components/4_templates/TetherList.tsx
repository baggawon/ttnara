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
  AppRoute,
  Currency,
  QueryKey,
  TetherCategories,
  TetherOrderby,
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
import { TetherTable } from "@/components/3_organisms/TetherTable";
import MobilePriceWidget from "@/components/1_atoms/MobilePriceWidget";
import { searchItems } from "@/helpers/config";
import { Card, CardHeader } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";

export const TetherList = ({
  page,
  pageSize,
  category_name,
  tether_id,
  currency,
  orderby,
  status,
  range,
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

  const pagination: TethersReadProps = {
    page: 1,
    pageSize: 20,
    range: TetherRange.In24Hours,
    ...(page && { page }),
    ...(pageSize && { pageSize }),
    ...(currency && { currency }),
    ...(category_name && { category_name }),
    ...(orderby && { orderby }),
    ...(typeof tether_id === "number" && { tether_id }),
    ...(status && { status }),
    ...(range && { range }),
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
      search: "",
      column: "title",
      category_name: "total",
      currency: Currency.원화,
      orderby: TetherOrderby.CreateNewer,
      status: TetherStatus.Total,
      ...pagination,
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
  useEffectFunctionHook({
    Function: () =>
      methods.setValue("orderby", orderby ?? TetherOrderby.CreateNewer),
    dependency: [orderby],
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

  const selectOrderby = (orderby: TetherOrderby) => {
    methods.setValue("orderby", orderby);
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

  const router = useRouter();

  const goWrite = () => {
    router.push(`${AppRoute.Threads}/tether/edit/0`);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <MobilePriceWidget />
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
                  <div className="ml-auto flex gap-2 md:gap-4 items-center flex-wrap">
                    <SelectInput
                      name="range"
                      onChange={selectRange}
                      buttonClassName="!w-fit"
                      items={[
                        {
                          value: TetherRange.In24Hours,
                          label: "최근 24시간",
                        },
                        {
                          value: TetherRange.InOneWeek,
                          label: "최근 1주일",
                        },
                        {
                          value: TetherRange.InOneMonth,
                          label: "최근 한달",
                        },
                      ]}
                    />
                    <SelectInput
                      name="status"
                      onChange={selectStatus}
                      buttonClassName="!w-fit"
                      items={[
                        {
                          value: TetherStatus.Total,
                          label: "전체보기",
                        },
                        {
                          value: TetherStatus.Open,
                          label: "거래가능 물품",
                        },
                        {
                          value: TetherStatus.Progress,
                          label: "거래중인 물품",
                        },
                        {
                          value: TetherStatus.Complete,
                          label: "거래완료 물품",
                        },
                      ]}
                    />
                    <SelectInput
                      name="orderby"
                      onChange={selectOrderby}
                      buttonClassName="!w-fit"
                      items={[
                        {
                          value: TetherOrderby.CreateNewer,
                          label: "최신순",
                        },
                        {
                          value: TetherOrderby.PriceExpensive,
                          label: "높은가격순",
                        },
                        {
                          value: TetherOrderby.PriceCheap,
                          label: "낮은가격순",
                        },
                        {
                          value: TetherOrderby.GoodTrader,
                          label: "우수거래자순",
                        },
                      ]}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" type="button">
                          <RefreshCcw className="h-[1.2rem] w-[1.2rem]" />
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
            <section className="grid grid-cols-1 gap-4">
              <TetherTable
                session={session}
                pagination={tethersData?.pagination}
                tethers={tethersData?.tethers}
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
            </div>
          </CardContent>
        </FormProvider>
      </Card>
    </div>
  );
};
