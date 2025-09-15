"use client";

import { FormProvider, useForm } from "react-hook-form";
import { QueryKey } from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { alarmGet } from "@/helpers/get";
import type { AlarmListResponse, AlarmReadProps } from "@/app/api/alarm/read";
import { usePathname, useRouter } from "next/navigation";
import { forEach, getBoolean, map } from "@/helpers/basic";
import { GnuboardPaginationSSR } from "@/components/2_molecules/Table/GnuboardPaginationSSR";
import AlarmItem from "@/components/2_molecules/AlarmItem";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SelectInput from "@/components/2_molecules/Input/Select";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { searchItemsForAlarm } from "@/helpers/config";

const SettingsNotificationListView = ({
  page,
  pageSize,
  isRead,
  search,
  column,
}: {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  search?: string;
  column?: string;
}) => {
  const pagination: AlarmReadProps = {
    page: 1,
    pageSize: 10,
    ...(page && { page }),
    ...(pageSize && { pageSize }),
    ...(typeof isRead === "boolean" && { isRead }),
    ...(search && { search }),
    ...(column && { column }),
  };

  const { data: alarms } = useGetQuery<AlarmListResponse, AlarmReadProps>(
    {
      queryKey: [{ [QueryKey.alarms]: pagination }],
    },
    alarmGet,
    pagination
  );

  const methods = useForm<AlarmReadProps>({
    defaultValues: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      isRead: "total" as any,
      search: "",
      column: "title",
      ...(search && { search }),
      ...(column && { column }),
      ...(typeof isRead === "boolean" && { isRead }),
    },
    reValidateMode: "onSubmit",
  });

  const pathname = usePathname();

  const router = useRouter();

  const updatePagination = () => {
    const prevProps = methods.getValues();
    const newProps = {
      page: Number(prevProps.page),
      pageSize: Number(prevProps.pageSize),
      search: prevProps.search === "" ? undefined : prevProps.search,
      isRead:
        (prevProps.isRead as any) === "total" ? undefined : prevProps.isRead,
    };
    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete (newProps as any)[key];
    });

    router.push(
      `${pathname}?${new URLSearchParams(newProps as any).toString()}`
    );
  };

  const selectIsRead = (isRead: string) => {
    if (isRead === "total") {
      methods.setValue("isRead", "total" as any);
    } else {
      methods.setValue("isRead", getBoolean(isRead));
    }
    updatePagination();
  };

  return (
    <FormProvider {...methods}>
      <WithUseWatch name={["isRead"]}>
        {({ isRead }: AlarmReadProps) => (
          <Tabs
            value={String(isRead)}
            onValueChange={selectIsRead}
            className="w-full flex gap-4 flex-wrap"
          >
            <TabsList>
              <TabsTrigger value="total">전체</TabsTrigger>
              <TabsTrigger value="false">안읽음</TabsTrigger>
              <TabsTrigger value="true">읽음</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </WithUseWatch>
      <section>
        {(alarms?.alarms?.length ?? 0) > 0 ? (
          map(alarms!.alarms, (alarm) => (
            <AlarmItem key={alarm.id} alarm={alarm} />
          ))
        ) : (
          <div className="h-[400px] w-full flex justify-center items-center">
            알림이 없습니다.
          </div>
        )}
      </section>
      <GnuboardPaginationSSR
        pagination={alarms?.pagination}
        setPageIndexAction={(index) => {
          methods.setValue("page", index);
          updatePagination();
        }}
      />

      <div className="flex justify-center gap-4 w-full">
        <SelectInput
          name="column"
          items={searchItemsForAlarm}
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
      </div>
    </FormProvider>
  );
};

export default SettingsNotificationListView;
