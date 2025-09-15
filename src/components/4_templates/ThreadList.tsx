"use client";

import type {
  ThreadsReadProps,
  ThreadListResponse,
  ThreadWithProfile,
} from "@/app/api/threads/read";
import { Input } from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { DataTableSSR } from "@/components/2_molecules/Table/DataTableSSR";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { forEach, map, now } from "@/helpers/basic";
import { searchItems } from "@/helpers/config";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { sessionGet, threadsGet, topicSettingsGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { AppRoute, QueryKey } from "@/helpers/types";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { getColumnHeaderTitle, getDisplayname } from "@/helpers/common";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import type { Session } from "next-auth";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Tether } from "@/components/1_atoms/coin/Tether";
import type { TopicSettings } from "@/app/api/topic/read";

export const ThreadList = ({
  page,
  category_name,
  topic_url,
  thread_id,
  search,
  column,
}: {
  page?: number;
  category_name?: string;
  topic_url: string;
  thread_id?: number;
  search?: string;
  column?: string;
}) => {
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    {
      queryKey: [QueryKey.session],
    },
    sessionGet
  );

  const { data: topicSettings } = useGetQuery<
    TopicSettings,
    { topic_url: string }
  >(
    {
      queryKey: [{ [QueryKey.topicSettings]: { topic_url } }],
      staleTime: Infinity,
    },
    topicSettingsGet,
    { topic_url }
  );

  const authLevel = session?.user?.auth_level ?? 0;
  const levelCreate = topicSettings?.level_create ?? 1;
  const canWrite = authLevel >= levelCreate;

  const use_thumbnail = topicSettings?.use_thumbnail;
  const topicPageNavSize = topicSettings?.thread_page_nav_size ?? 10;

  const pagination: ThreadsReadProps = {
    page: 1,
    ...(page && { page }),
    ...(thread_id && { thread_id }),
    ...(category_name && { category_name }),
    ...(search && { search }),
    ...(column && { column }),
    topic_url,
  };

  const { data: threadsData } = useGetQuery<
    ThreadListResponse,
    ThreadsReadProps
  >(
    {
      queryKey: [
        {
          [QueryKey.threads]: pagination,
        },
      ],
    },
    threadsGet,
    pagination
  );

  const columns: CustomColumDef<ThreadWithProfile>[] = setDefaultColumn([
    {
      accessorKey: "topic_order",
      headerTitle: "번호",
      header: ({ column }) => getColumnHeaderTitle(column),
      headerClassName: "w-[74px] hidden sm:table-cell md:hidden lg:table-cell",
      cellClassName: "w-[74px] hidden sm:table-cell md:hidden lg:table-cell",
      cell: (props) => {
        const isNotice = props.row.original.is_notice;
        return isNotice ? (
          <span className="text-red-500 font-bold">[공지]</span>
        ) : props.row.original.id === thread_id ? (
          "열람중"
        ) : (
          props.getValue()
        );
      },
    },
    ...(use_thumbnail
      ? ([
          {
            accessorKey: "image",
            headerTitle: "썸네일",
            headerClassName: "w-[90px]",
            cellClassName: "w-[90px] flex items-center justify-center",
            enableSorting: false,
            cell: (props) => {
              const images = props.row.original.images;
              return images.length > 0 ? (
                <Image
                  src={`https://${images[0].aws_cloud_front_url}`}
                  alt="Thread Image"
                  className="w-[80px] h-[60px] object-contain"
                  width={80}
                  height={60}
                />
              ) : (
                <Tether className="w-[80px] h-[60px]" />
              );
            },
          },
        ] as CustomColumDef<ThreadWithProfile>[])
      : []),
    {
      accessorKey: "title",
      headerTitle: "제목",
      headerClassName: "w-full",
      cellClassName: "w-full",
      header: ({ column }) => getColumnHeaderTitle(column),
      cell: (props) => {
        const isNotice = props.row.original.is_notice;
        const hasComment = props.row.original.comments.length > 0;
        const isToday = dayjs(props.row.original.created_at)
          .tz("Asia/Seoul")
          .add(1, "day")
          .isAfter(now());
        return (
          <div className="flex space-x-2 w-full">
            <span className="flex gap-1 items-center w-full">
              <b
                className={clsx(
                  "truncate",
                  hasComment &&
                    isToday &&
                    "max-w-[calc(100%-0.5rem-14px-20px)]",
                  hasComment && !isToday && "max-w-[calc(100%-0.25rem-14px)]",
                  !hasComment && isToday && "max-w-[calc(100%-0.25rem-20px)]",
                  !hasComment && !isToday && "max-w-[calc(100%-0.005rem)]",
                  isNotice ? "font-bold" : "font-normal"
                )}
              >
                {props.getValue()}
              </b>
              {hasComment && (
                <p className="text-[12px] text-red-500">
                  [{props.row.original.comments.length}]
                </p>
              )}
              {isToday && (
                <Badge
                  variant="outline"
                  className="!text-[12px] text-red-500 p-0 h-[20px] w-[20px] flex items-center justify-center"
                >
                  N
                </Badge>
              )}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "displayname",
      headerTitle: "글쓴이",
      headerClassName: "hidden lg:table-cell w-[100px]",
      cellClassName: "hidden lg:table-cell w-[100px]",
      header: ({ column }) => getColumnHeaderTitle(column),
      cell: (props) => getDisplayname(props.row.original.author?.profile),
    },
    {
      accessorKey: "created_at",
      headerTitle: "날짜",
      header: ({ column }) => getColumnHeaderTitle(column),
      headerClassName: "w-[74px]",
      cellClassName: "w-[74px]",
      convertValue: (value) => dayjs(value).tz("Asia/Seoul").format("MM-DD"),
    },
    {
      accessorKey: "views",
      header: ({ column }) => getColumnHeaderTitle(column),
      headerClassName: "hidden sm:table-cell w-[74px]",
      cellClassName: "hidden sm:table-cell w-[74px]",
      headerTitle: "조회",
      cell: (props) => {
        return <div className="text-right">{props.getValue()}</div>;
      },
    },
  ]);

  const methods = useForm<ThreadsReadProps>({
    defaultValues: {
      page: pagination.page,
      search: "",
      column: "title",
      category_name: category_name ?? "전체",
      ...(search && { search }),
      ...(column && { column }),
    },
    reValidateMode: "onSubmit",
  });

  const pathname = usePathname();

  const updatePagination = (isPage?: boolean) => {
    const prevProps = methods.getValues();
    const newProps = {
      page: Number(prevProps.page),
      search: prevProps.search === "" ? undefined : prevProps.search,
      topic_url,
      category_name:
        prevProps.category_name === "전체"
          ? undefined
          : prevProps.category_name,
      ...(prevProps.search !== "" && {
        column: prevProps.column,
      }),
      ...(typeof thread_id === "number" && !isPage && { thread_id }),
    };
    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete (newProps as any)[key];
    });

    if (isPage) {
      router.push(
        `${AppRoute.Threads}/${topic_url}?${new URLSearchParams(newProps as any).toString()}`
      );
    } else {
      router.push(
        `${pathname}?${new URLSearchParams(newProps as any).toString()}`
      );
    }
  };

  const router = useRouter();

  const goWrite = () => {
    router.push(`${AppRoute.Threads}/${topic_url}/edit/0`);
  };

  const onRowClick = (data: ThreadWithProfile) => {
    router.push(
      `${AppRoute.Threads}/${topic_url}/${data.id}?${new URLSearchParams({ ...pagination, thread_id: data.id } as any).toString()}`
    );
  };

  const selectCategory = (category_name: string) => {
    methods.setValue("category_name", category_name);
    updatePagination();
  };

  const sortedThreads = threadsData?.threads
    ? [...threadsData.threads]
        .map((thread) => ({
          ...thread,
          displayname: thread.author?.profile?.displayname,
        }))
        .sort((a, b) => {
          if (a.is_notice && !b.is_notice) return -1;
          if (!a.is_notice && b.is_notice) return 1;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        })
    : [];

  return (
    <div className="w-full flex flex-col gap-4">
      <Card className="overflow-hidden border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b py-3 sm:py-6">
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sm:w-6 sm:h-6"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <h1>{threadsData?.name}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 flex flex-col gap-4 sm:gap-6">
          <FormProvider {...methods}>
            {threadsData && (
              <ToggleGroupInput
                name="category_name"
                variant="outline"
                className={clsx(
                  "gap-2 whitespace-nowrap justify-start",
                  "[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:last-child]:border-r"
                )}
                orientation="horizontal"
                onValueChange={selectCategory}
              >
                <ToggleGroupItem value="전체" aria-label="전체" key="total">
                  전체
                </ToggleGroupItem>
                {map(threadsData.categories, (category) => (
                  <ToggleGroupItem
                    key={`${category.id}*&*${category.topic_id}*&*${category.name}`}
                    value={category.name}
                    aria-label={category.name}
                  >
                    {category.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroupInput>
            )}
            <DataTableSSR
              columns={columns}
              data={sortedThreads}
              placeholder="게시글이 없습니다."
              setPageIndexAction={(index) => {
                methods.setValue("page", index);
                updatePagination(true);
              }}
              pagination={threadsData?.pagination}
              onRowClassName={() =>
                "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }
              onRowClick={onRowClick}
              topicPageNavSize={topicPageNavSize}
            />

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="flex items-center gap-3 w-full">
                <SelectInput
                  name="column"
                  items={searchItems}
                  buttonClassName="!w-[150px] shrink-0"
                  buttonWrapClassName="shrink-0"
                />
                <div className="relative flex-1">
                  <Input
                    name="search"
                    className="w-full"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updatePagination();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => updatePagination()}
                  >
                    <SearchIcon className="h-4 w-4" />
                    <span className="sr-only">검색</span>
                  </Button>
                </div>
              </div>
              {canWrite && (
                <Button
                  type="button"
                  onClick={goWrite}
                  className="px-4 bg-primary hover:bg-primary/90 w-full sm:w-auto shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  글쓰기
                </Button>
              )}
            </div>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
};
