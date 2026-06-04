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
import { ImageOff, SearchIcon, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import {
  getColumnHeaderTitle,
  getBoardPosterDisplayname,
} from "@/helpers/common";
import { BoardRankIcon } from "@/components/1_atoms/BoardRankIcon";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import type { Session } from "next-auth";
import { usePathname } from "next/navigation";
import Image from "next/image";
import type { TopicSettings } from "@/app/api/topic/read";
import { ThreadBadges } from "@/components/1_atoms/ThreadBadges";
import useTopicPoints from "@/helpers/customHook/useTopicPoints";

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
    sessionGet,
    undefined,
    { silent: true }
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
    { topic_url },
    { silent: true }
  );

  const authLevel = session?.user?.auth_level ?? 0;
  const levelCreate = topicSettings?.level_create ?? 1;
  const canWrite = authLevel >= levelCreate;

  const topicPoints = useTopicPoints(topicSettings);
  const writeBlocked =
    topicPoints.cost.write > 0 && !topicPoints.canAfford.write;
  const writeTitle = writeBlocked
    ? `포인트가 부족합니다 (필요: ${topicPoints.cost.write.toLocaleString()}P)`
    : topicPoints.cost.write > 0
      ? `${topicPoints.cost.write.toLocaleString()}P 차감`
      : undefined;

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
    pagination,
    { silent: true }
  );

  const columns: CustomColumDef<ThreadWithProfile>[] = setDefaultColumn([
    {
      accessorKey: "topic_order",
      headerTitle: "번호",
      header: ({ column }) => getColumnHeaderTitle(column),
      headerClassName: "w-[74px] hidden sm:table-cell md:hidden lg:table-cell",
      cellClassName: "w-[74px] hidden sm:table-cell md:hidden lg:table-cell",
      cell: (props) => {
        return props.row.original.id === thread_id
          ? "열람중"
          : props.getValue();
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
              const fallback = threadsData?.default_thumbnail_url;
              if (images.length > 0) {
                return (
                  <Image
                    src={images[0].aws_cloud_front_url}
                    alt="Thread Image"
                    className="w-[80px] h-[60px] object-contain"
                    width={80}
                    height={60}
                  />
                );
              }
              if (fallback) {
                return (
                  <Image
                    src={fallback}
                    alt="Default thumbnail"
                    className="w-[80px] h-[60px] object-contain"
                    width={80}
                    height={60}
                  />
                );
              }
              return (
                <div className="w-[80px] h-[60px] border border-dashed border-neutral-300 rounded-sm flex flex-col items-center justify-center gap-0.5 bg-neutral-50 text-neutral-400">
                  <ImageOff className="w-4 h-4" />
                  <span className="text-[10px] leading-none">이미지 없음</span>
                </div>
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
              <ThreadBadges
                commentCount={props.row.original.comments.length}
                views={props.row.original.views}
              />
              {isNotice && (
                <span className="text-red-500 font-bold shrink-0">[공지]</span>
              )}
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
      headerClassName: "hidden lg:table-cell w-[160px]",
      cellClassName: "hidden lg:table-cell w-[160px]",
      header: ({ column }) => getColumnHeaderTitle(column),
      cell: (props) =>
        props.row.original.is_secret ? (
          "익명"
        ) : (
          <span className="flex items-center gap-1 min-w-0">
            <BoardRankIcon
              profile={props.row.original.author?.profile}
              topicLevelModerator={topicSettings?.level_moderator}
              className="w-5"
            />
            <span className="truncate min-w-0">
              {getBoardPosterDisplayname(
                props.row.original.author?.profile,
                topicSettings?.level_moderator,
                session?.user
              )}
            </span>
          </span>
        ),
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
    <div className="w-full flex flex-col gap-5">
      <FormProvider {...methods}>
        <div className="flex items-end justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
              {threadsData?.name}
            </h1>
            {typeof threadsData?.pagination?.totalItems === "number" && (
              <p className="text-xs text-muted-foreground">
                총 {threadsData.pagination.totalItems.toLocaleString()}개의
                게시글
              </p>
            )}
          </div>
          {canWrite && (
            <Button
              type="button"
              onClick={goWrite}
              disabled={writeBlocked}
              title={writeTitle}
              size="sm"
              className="shrink-0 gap-1.5"
            >
              <PencilLine className="h-4 w-4" />
              글쓰기
            </Button>
          )}
        </div>

        {threadsData && threadsData.categories.length > 0 && (
          <ToggleGroupInput
            name="category_name"
            variant="outline"
            className={clsx(
              "gap-1.5 whitespace-nowrap justify-start flex-wrap",
              "[&>button]:rounded-full [&>button]:border [&>button]:border-border [&>button]:px-3 [&>button]:h-8 [&>button]:text-xs [&>button]:font-medium",
              "[&>button[data-state=on]]:bg-primary [&>button[data-state=on]]:text-primary-foreground [&>button[data-state=on]]:border-primary"
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
            "cursor-pointer hover:bg-muted/40 transition-colors"
          }
          onRowClick={onRowClick}
          topicPageNavSize={topicPageNavSize}
        />

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
          <SelectInput
            name="column"
            items={searchItems}
            buttonClassName="!w-[110px] !h-9 shrink-0"
            buttonWrapClassName="shrink-0"
          />
          <div className="relative flex-1 w-full">
            <Input
              name="search"
              className="w-full h-9 pr-9"
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
              className="absolute top-1/2 right-1 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => updatePagination()}
            >
              <SearchIcon className="h-4 w-4" />
              <span className="sr-only">검색</span>
            </Button>
          </div>
        </div>
      </FormProvider>
    </div>
  );
};
