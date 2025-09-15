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
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { usePathname, useRouter } from "next/navigation";
import { AppRoute, Currency, QueryKey, TetherStatus } from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import type {
  TetherListResponse,
  TethersReadProps,
} from "@/app/api/tethers/read";
import { sessionGet, tethersGet } from "@/helpers/get";
import type { Session } from "next-auth";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { TetherTable } from "@/components/3_organisms/TetherTable";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { searchItems } from "@/helpers/config";

export const MyTetherList = ({
  page,
  pageSize,
  status,
  currency,
  search,
  column,
}: {
  page?: number;
  pageSize?: number;
  status?: TetherStatus;
  currency?: string;
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
    pageSize: 10,
    status: TetherStatus.Total,
    usePersonal: true,
    ...(page && { page }),
    ...(pageSize && { pageSize }),
    ...(currency && { currency }),
    ...(status && { status }),
    ...(search && { search }),
    ...(column && { column }),
  };

  const { data: tethersData } = useGetQuery<
    TetherListResponse,
    TethersReadProps
  >(
    {
      queryKey: [{ [QueryKey.tethers]: pagination }],
    },
    tethersGet,
    pagination
  );

  const methods = useForm<TethersReadProps>({
    defaultValues: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: "",
      column: "title",
      status: TetherStatus.Total,
      currency: Currency.원화,
      ...(currency && { currency }),
      ...(status && { status }),
      ...(search && { search }),
      ...(column && { column }),
    },
    reValidateMode: "onSubmit",
  });

  useEffectFunctionHook({
    Function: () => {
      if (status) methods.setValue("status", status);
    },
    dependency: [status],
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
      status: prevProps.status,
      ...(prevProps.search !== "" && {
        column: prevProps.column,
      }),
      currency: prevProps.currency,
      usePersonal: true,
    };
    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete (newProps as any)[key];
    });

    router.push(
      `${pathname}?${new URLSearchParams(newProps as any).toString()}`
    );
  };

  const selectStatus = (status: string) => {
    if (status !== "") {
      methods.setValue("status", status as TetherStatus);
      updatePagination();
    }
  };

  const selectCurrency = (currency: string) => {
    methods.setValue("currency", currency);
    updatePagination();
  };

  const router = useRouter();

  const goWrite = () => {
    router.push(`${AppRoute.Threads}/tether/edit/0`);
  };

  return (
    <FormProvider {...methods}>
      <WithUseWatch name={["status"]}>
        {({ status }: TethersReadProps) => (
          <Tabs
            value={status}
            onValueChange={selectStatus}
            className="w-full flex gap-4 flex-wrap"
          >
            <TabsList>
              <TabsTrigger value={TetherStatus.Total}>전체</TabsTrigger>
              <TabsTrigger value={TetherStatus.MyPageProgress}>
                거래중
              </TabsTrigger>
              <TabsTrigger value={TetherStatus.Complete}>완료</TabsTrigger>
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
                  <ToggleGroupItem value={value} aria-label={label} key={value}>
                    {label}
                  </ToggleGroupItem>
                )
              )}
            </ToggleGroupInput>
          </Tabs>
        )}
      </WithUseWatch>

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
      </section>
    </FormProvider>
  );
};
