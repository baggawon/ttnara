"use client";

import type {
  AmadoEventWithLocal,
  AmadoEventsReadResult,
} from "@/app/api/admin_di2u3k2j/amado/events/read";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { adminAmadoEventsGet } from "@/helpers/get";
import { AppRoute, QueryKey } from "@/helpers/types";
import clsx from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Eye,
  Pencil,
  RefreshCw,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CreatePostSheet } from "@/app/(admin)/admin/featured/CreatePostSheet";
import { MissingCategoriesDialog } from "@/app/(admin)/admin/featured/MissingCategoriesDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { postJson } from "@/helpers/common";
import { ApiRoute } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";
import { useToast } from "@/components/ui/use-toast";
import type { FeaturedPostToggleProps } from "@/app/api/admin_di2u3k2j/featured/post/toggle-featured";
import { useRouter } from "next/navigation";

dayjs.extend(relativeTime);
dayjs.locale("ko");

type StatusFilter = "all" | "open" | "ended";
type PostStateFilter = "all" | "missing" | "created";

export interface UploadSettings {
  use_upload_file: boolean;
  max_upload_items: number;
  max_file_size_mb: number;
  allowed_file_extensions: string;
  use_thumbnail: boolean;
}

interface Props {
  topicId: number;
  topicName: string;
  topicUrl: string;
  topicCategories: { id: number; name: string }[];
  uploadSettings: UploadSettings;
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "open", label: "진행중" },
  { value: "ended", label: "마감/종료" },
];

const POST_STATE_FILTERS: { value: PostStateFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "missing", label: "미작성" },
  { value: "created", label: "작성됨" },
];

const formatVolume = (krw: number | null): string => {
  if (krw == null) return "-";
  if (krw >= 100_000_000) return `${(krw / 100_000_000).toFixed(1)}억 원`;
  if (krw >= 10_000) return `${Math.round(krw / 10_000).toLocaleString()}만 원`;
  return `${krw.toLocaleString()}원`;
};

export const FeaturedManager = ({
  topicId,
  topicName,
  topicCategories,
  uploadSettings,
}: Props) => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [postStateFilter, setPostStateFilter] =
    useState<PostStateFilter>("all");
  // One target carries both intent + event payload so the sheet can switch
  // between create and edit without juggling separate state slots.
  const [sheetTarget, setSheetTarget] = useState<{
    mode: "create" | "edit";
    event: AmadoEventWithLocal;
    postId: number | null;
  } | null>(null);
  const [missingDialogOpen, setMissingDialogOpen] = useState(false);
  const autoPoppedRef = useRef(false);
  const router = useRouter();
  const { toast } = useToast();
  // Optimistic mirror of is_featured per event id while the toggle request is
  // in flight. Cleared when the events query refetches.
  const [pendingFeatured, setPendingFeatured] = useState<
    Record<number, boolean>
  >({});

  const { data, status } = useGetQuery<AmadoEventsReadResult, undefined>(
    {
      queryKey: [QueryKey.adminAmadoEvents],
      staleTime: 60_000,
    },
    adminAmadoEventsGet,
    undefined,
    { silent: true }
  );
  const isFetching = status === "pending";

  const events = data?.events ?? [];

  const filtered = useMemo<AmadoEventWithLocal[]>(() => {
    return events.filter((e) => {
      if (statusFilter === "open" && e.status !== "open") return false;
      if (statusFilter === "ended" && e.status === "open") return false;
      if (postStateFilter === "missing" && e.local_post) return false;
      if (postStateFilter === "created" && !e.local_post) return false;
      return true;
    });
  }, [events, statusFilter, postStateFilter]);

  const missingCount = events.filter((e) => !e.local_post).length;
  const createdCount = events.length - missingCount;

  // Exact-match string set of Amado-supplied category names that don't yet
  // exist as a category on the special topic. Admins need parity to render
  // the category chip on home cards.
  const missingCategories = useMemo<string[]>(() => {
    if (events.length === 0) return [];
    const localNames = new Set(topicCategories.map((c) => c.name));
    const sourceNames = new Set(events.map((e) => e.category));
    return Array.from(sourceNames).filter((n) => !localNames.has(n));
  }, [events, topicCategories]);

  // Auto-popup once per mount when we first detect missing categories; the
  // banner stays visible afterward so admins can re-open the dialog any time.
  useEffect(() => {
    if (!autoPoppedRef.current && missingCategories.length > 0) {
      autoPoppedRef.current = true;
      setMissingDialogOpen(true);
    }
  }, [missingCategories]);

  const refresh = () => {
    refreshCache(queryClient, QueryKey.adminAmadoEvents);
    setPendingFeatured({});
  };

  const handleToggleFeatured = async (
    event: AmadoEventWithLocal,
    next: boolean
  ) => {
    if (!event.local_post) return;
    setPendingFeatured((prev) => ({ ...prev, [event.local_post!.id]: next }));
    try {
      const { isSuccess, hasMessage } = await postJson<FeaturedPostToggleProps>(
        ApiRoute.adminFeaturedPostToggle,
        { id: event.local_post.id, is_featured: next }
      );
      if (isSuccess) {
        toast({
          id: next
            ? "운영자 PICK으로 지정했습니다."
            : "운영자 PICK에서 해제했습니다.",
          type: "success",
        });
        refresh();
      } else {
        // Revert the optimistic flip on failure.
        setPendingFeatured((prev) => {
          const copy = { ...prev };
          delete copy[event.local_post!.id];
          return copy;
        });
        toast({ id: hasMessage ?? ToastData.unknown, type: "error" });
      }
    } catch {
      setPendingFeatured((prev) => {
        const copy = { ...prev };
        delete copy[event.local_post!.id];
        return copy;
      });
      toast({ id: ToastData.unknown, type: "error" });
    }
  };

  return (
    <section className="w-full flex flex-col gap-4">
      <header className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">이벤트 리스트</h2>
          <p className="text-sm text-muted-foreground mt-1">
            홈 게시판/카드형 게시판인{" "}
            <span className="font-medium text-foreground">{topicName}</span>에
            노출할 게시글을 이벤트 리스트에서 선택해 작성합니다.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isFetching}
        >
          <RefreshCw
            className={clsx("h-4 w-4 mr-1.5", isFetching && "animate-spin")}
          />
          새로고침
        </Button>
      </header>

      {missingCategories.length > 0 && (
        <Alert className="border-amber-300 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-sm">
            누락된 카테고리 {missingCategories.length}개
          </AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between gap-2 flex-wrap">
            <span>
              {missingCategories.slice(0, 5).join(", ")}
              {missingCategories.length > 5
                ? ` 외 ${missingCategories.length - 5}개`
                : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMissingDialogOpen(true)}
            >
              자세히 보기
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <FilterRow
          label="상태"
          value={statusFilter}
          options={STATUS_FILTERS}
          onChange={setStatusFilter}
        />
        <FilterRow
          label="게시글"
          value={postStateFilter}
          options={POST_STATE_FILTERS.map((f) =>
            f.value === "missing"
              ? { ...f, label: `미작성 (${missingCount})` }
              : f.value === "created"
                ? { ...f, label: `작성됨 (${createdCount})` }
                : f
          )}
          onChange={setPostStateFilter}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            조건에 맞는 이벤트가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                pendingFeatured={
                  event.local_post
                    ? pendingFeatured[event.local_post.id]
                    : undefined
                }
                onCreate={() =>
                  setSheetTarget({
                    mode: "create",
                    event,
                    postId: null,
                  })
                }
                onEdit={() => {
                  if (!event.local_post) return;
                  setSheetTarget({
                    mode: "edit",
                    event,
                    postId: event.local_post.id,
                  });
                }}
                onToggleFeatured={(next) => handleToggleFeatured(event, next)}
              />
            ))}
          </div>
        </TooltipProvider>
      )}

      <CreatePostSheet
        open={sheetTarget !== null}
        onOpenChange={(o) => {
          if (!o) setSheetTarget(null);
        }}
        mode={sheetTarget?.mode ?? "create"}
        event={sheetTarget?.event ?? null}
        existingPostId={sheetTarget?.postId ?? null}
        topicCategories={topicCategories}
        uploadSettings={uploadSettings}
        onSaved={refresh}
      />

      <MissingCategoriesDialog
        open={missingDialogOpen}
        onOpenChange={setMissingDialogOpen}
        missing={missingCategories}
        topicId={topicId}
        topicName={topicName}
        onCreated={() => {
          // Server component owns `topicCategories`, so a router refresh is
          // needed to pick up the newly created rows. Also bust the events
          // query so the missing-set recomputes on the next render.
          router.refresh();
          refresh();
        }}
      />
    </section>
  );
};

const FilterRow = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) => (
  <div className="flex items-center gap-2 overflow-x-auto pb-1">
    <span className="text-xs font-medium text-muted-foreground shrink-0 min-w-[3rem]">
      {label}
    </span>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={clsx(
          "px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors",
          value === opt.value
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-foreground border-border hover:bg-muted"
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const EventCard = ({
  event,
  pendingFeatured,
  onCreate,
  onEdit,
  onToggleFeatured,
}: {
  event: AmadoEventWithLocal;
  pendingFeatured?: boolean;
  onCreate: () => void;
  onEdit: () => void;
  onToggleFeatured: (next: boolean) => void;
}) => {
  const mot = event.moment_of_truth ? dayjs(event.moment_of_truth) : null;
  const isEnded =
    event.status !== "open" || (mot != null && mot.isBefore(dayjs()));
  const statusLabel =
    event.status === "resolved"
      ? "종료"
      : event.status === "closed"
        ? "마감"
        : isEnded
          ? "마감"
          : "진행중";
  const hasPost = event.local_post !== null;
  const postHref = event.local_post
    ? `${AppRoute.Threads}/${event.local_post.topic_url}/${event.local_post.id}`
    : null;
  // `pendingFeatured` (if present) is the optimistic mirror set by the
  // toggle handler; it wins until the next refetch clears it. Otherwise
  // we render the server's stored value.
  const isFeatured = pendingFeatured ?? event.local_post?.is_featured ?? false;

  return (
    <Card
      className={clsx(
        "flex flex-col hover:shadow-md transition-shadow",
        hasPost && "ring-1 ring-emerald-200 dark:ring-emerald-900"
      )}
    >
      <CardContent className="flex flex-col gap-2 p-3 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px]">
              {event.category}
            </Badge>
            {hasPost && (
              <Badge
                variant="outline"
                className="text-[11px] border-emerald-300 text-emerald-700 dark:text-emerald-400 dark:border-emerald-800"
              >
                <CheckCircle2 className="h-3 w-3 mr-0.5" />
                작성됨
              </Badge>
            )}
            {event.archived && (
              <Badge
                variant="outline"
                className="text-[11px] border-rose-300 text-rose-600 dark:text-rose-400 dark:border-rose-900"
              >
                만료
              </Badge>
            )}
          </div>
          <Badge
            variant={event.status === "open" ? "default" : "outline"}
            className={clsx(
              "text-[11px]",
              event.status === "open"
                ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                : "bg-background"
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        <h3 className="font-semibold text-sm line-clamp-2 break-words leading-snug min-h-[2.5rem]">
          {event.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {mot ? (
              <>
                {mot.format("YYYY-MM-DD HH:mm")} ·{" "}
                <span
                  className={clsx(
                    isEnded
                      ? "text-muted-foreground"
                      : "text-primary font-medium"
                  )}
                >
                  {isEnded ? `${mot.fromNow()} 종료` : `${mot.fromNow()} 결정`}
                </span>
              </>
            ) : (
              "마감일 미정"
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>거래액 {formatVolume(event.volume_krw)}</span>
        </div>

        <div className="flex items-center gap-2 pt-1 mt-auto">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <a
              href={event.detail_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Amado에서 보기
            </a>
          </Button>
          {hasPost && postHref ? (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                  >
                    <Link href={postHref}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">게시글 보기</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>게시글 보기</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={onEdit}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">게시글 수정</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>게시글 수정</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className={clsx(
                      "h-8 w-8",
                      isFeatured &&
                        "bg-amber-50 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800"
                    )}
                    onClick={() => onToggleFeatured(!isFeatured)}
                  >
                    <Star
                      className={clsx(
                        "h-4 w-4",
                        isFeatured
                          ? "fill-amber-400 text-amber-500"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="sr-only">
                      {isFeatured ? "운영자 PICK 해제" : "운영자 PICK 지정"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFeatured ? "운영자 PICK 해제" : "운영자 PICK 지정"}
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={isEnded}
              onClick={onCreate}
            >
              게시글 만들기
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
