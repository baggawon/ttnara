"use client";

import type { ThreadWithProfile } from "@/app/api/threads/read";
import { ThreadBadges } from "@/components/1_atoms/ThreadBadges";
import { Button } from "@/components/ui/button";
import {
  User,
  Calendar,
  Eye,
  MessageSquare,
  Copy,
  ArrowLeft,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { sessionGet, threadGet, topicSettingsGet } from "@/helpers/get";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import { redirect, useRouter } from "next/navigation";
import {
  getBoardPosterDisplayname,
  postJson,
  refreshCache,
} from "@/helpers/common";
import { ThreadList } from "@/components/4_templates/ThreadList";
import { useToast } from "@/components/ui/use-toast";
import type { threadDeleteProps } from "@/app/api/threads/delete";
import { ToastData } from "@/helpers/toastData";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import { FormProvider, useForm } from "react-hook-form";
import Form from "@/components/1_atoms/Form";
import { commentDefault } from "@/helpers/defaultValue";
import type { comment } from "@prisma/client";
import { validateComment } from "@/helpers/validate";
import { Input } from "@/components/2_molecules/Input/FormInput";
import { map } from "@/helpers/basic";
import type { CommentUpdateProps } from "@/app/api/threads/comment/update";
import HTMLViewer from "@/components/1_atoms/HTMLViewer";
import type { Session } from "next-auth";
import type { TopicSettings } from "@/app/api/topic/read";
import { VoteButtons } from "@/components/2_molecules/VoteButtons";
import useTopicPoints from "@/helpers/customHook/useTopicPoints";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRef } from "react";

export const ThreadDetailPage = ({
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
  thread_id: number;
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
    TopicSettings, // New type needed
    { topic_url: string }
  >(
    {
      queryKey: [{ [QueryKey.topicSettings]: { topic_url } }],
      // Revalidate on mount rather than caching forever. This setting decides
      // whether the page renders the fullview (home-card) layout or the normal
      // board layout; an admin can flip `fullview_on_homepage` mid-session, and
      // with staleTime: Infinity a client that had cached the old value kept
      // rendering the wrong layout until a hard refresh.
      staleTime: 0,
    },
    topicSettingsGet, // New API endpoint needed
    { topic_url },
    { silent: true }
  );

  // Get specific thread if editing
  const { data: currentThread } = useGetQuery<
    ThreadWithProfile,
    { topic_url: string; thread_id: number }
  >(
    {
      queryKey: [{ [QueryKey.thread]: { topic_url, thread_id } }],
      staleTime: Infinity,
      enabled: thread_id > 0,
    },
    threadGet,
    { topic_url, thread_id },
    { silent: true }
  );

  const authLevel = session?.user?.auth_level ?? 0;

  const levelRead = topicSettings?.level_read ?? 1;
  const levelComment = topicSettings?.level_comment ?? 1;
  const levelModerator = topicSettings?.level_moderator ?? 0;

  const isModerator = authLevel >= levelModerator;
  const isAppAdmin = session?.user?.is_app_admin;
  const isAuthor = currentThread?.author_id === session?.user?.id;

  const canRead = authLevel >= levelRead;
  // Card-format home topics are managed only from dedicated admin CRUD pages,
  // so the conventional edit/delete actions are hidden here regardless of role.
  // Gate on `topicSettings` being loaded so we don't flash the normal-board
  // actions before we know this is a fullview topic.
  const canEdit =
    !!topicSettings &&
    !topicSettings.fullview_on_homepage &&
    (isAppAdmin || isModerator || isAuthor);
  const canComment = authLevel >= levelComment;

  const topicPoints = useTopicPoints(topicSettings);
  const commentBlocked =
    topicPoints.cost.comment > 0 && !topicPoints.canAfford.comment;
  const commentTitle = commentBlocked
    ? `포인트가 부족합니다 (필요: ${topicPoints.cost.comment.toLocaleString()}P)`
    : topicPoints.cost.comment > 0
      ? `${topicPoints.cost.comment.toLocaleString()}P 차감`
      : undefined;

  const router = useRouter();

  if (!canRead) {
    redirect(AppRoute.Main);
  }

  const getCategory = () => {
    if (!category_name) return "";

    const searchParams = new URLSearchParams({ category: category_name });
    return `?${searchParams.toString()}`;
  };

  const goBackList = () => {
    router.push(`${AppRoute.Threads}/${topic_url}${getCategory()}`);
  };
  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("주소가 복사되었습니다!"); // 또는 토스트 메시지 등으로 피드백
    } catch (err) {
      // 모던 방식 실패시 폴백
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        alert("주소가 복사되었습니다!");
      } catch (error) {
        alert("주소 복사에 실패했습니다.");
        console.error("복사 실패:", error);
      }

      textArea.remove();
    }
  };

  const goEdit = () => {
    router.push(`${AppRoute.Threads}/${topic_url}/edit/${thread_id}`);
  };

  const { toast } = useToast();

  const queryClient = useQueryClient();
  const threadQueryKey = [{ [QueryKey.thread]: { topic_url, thread_id } }];

  const threadDeleteMutation = useMutation({
    mutationFn: async () => {
      const { isSuccess, hasMessage } = await postJson<threadDeleteProps>(
        ApiRoute.threadsDelete,
        { deleteThreadId: thread_id, topic_url }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.thread);
        refreshCache(queryClient, QueryKey.threads);
        goBackList();
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const methods = useForm<comment>({
    defaultValues: commentDefault({ thread_id }),
    reValidateMode: "onSubmit",
  });

  // Negative ids never collide with server ids; used to mark optimistic rows
  // that we may still need to revert before the server confirms the write.
  const tempIdRef = useRef(-1);
  const allocateTempId = () => tempIdRef.current--;

  const commentCreateMutation = useMutation({
    mutationFn: async (props: comment) => {
      const tempId = allocateTempId();
      const sessionUser = (session as any)?.user;
      const optimisticComment: any = {
        ...props,
        id: tempId,
        thread_id,
        author_id: sessionUser?.id ?? null,
        created_at: new Date(),
        updated_at: new Date(),
        author: {
          profile: {
            displayname: sessionUser?.displayname ?? "",
            is_app_admin: !!sessionUser?.is_app_admin,
            auth_level: sessionUser?.auth_level ?? 0,
          },
        },
      };

      const snapshot = queryClient.getQueryData<any>(threadQueryKey);
      queryClient.setQueryData<any>(threadQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          comments: [...(old.comments ?? []), optimisticComment],
        };
      });
      methods.reset(commentDefault({ thread_id }));

      try {
        const { isSuccess, hasMessage, hasData } =
          await postJson<CommentUpdateProps>(ApiRoute.threadCommentUpdate, {
            ...props,
            topic_url,
          });
        if (hasMessage) {
          toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
        }
        if (!isSuccess) {
          queryClient.setQueryData<any>(threadQueryKey, snapshot);
          return;
        }
        // Swap the temp id (and timestamp) for the canonical server values so
        // a follow-up delete targets the real row instead of our placeholder.
        if (hasData) {
          queryClient.setQueryData<any>(threadQueryKey, (old: any) => {
            if (!old) return old;
            return {
              ...old,
              comments: (old.comments ?? []).map((c: any) =>
                c.id === tempId
                  ? {
                      ...c,
                      id: hasData.id,
                      created_at: hasData.created_at ?? c.created_at,
                      updated_at: hasData.updated_at ?? c.updated_at,
                    }
                  : c
              ),
            };
          });
        }
      } catch (error) {
        queryClient.setQueryData<any>(threadQueryKey, snapshot);
        toast({ id: ToastData.unknown, type: "error" });
      }
    },
  });

  const commentDeleteMutation = useMutation({
    mutationFn: async (deleteCommentId: number) => {
      // Guard against deleting an optimistic row whose temp id never made it
      // to the server. The cache reconcile in commentCreateMutation should
      // beat the user to it, but this is the safety net.
      if (deleteCommentId < 0) return;
      const snapshot = queryClient.getQueryData<any>(threadQueryKey);
      queryClient.setQueryData<any>(threadQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          comments: (old.comments ?? []).filter(
            (c: any) => c.id !== deleteCommentId
          ),
        };
      });

      try {
        const { isSuccess, hasMessage } = await postJson(
          ApiRoute.threadCommentDelete,
          { deleteCommentId }
        );
        if (hasMessage) {
          toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
        }
        if (!isSuccess) {
          queryClient.setQueryData<any>(threadQueryKey, snapshot);
        }
      } catch (error) {
        queryClient.setQueryData<any>(threadQueryKey, snapshot);
        toast({ id: ToastData.unknown, type: "error" });
      }
    },
  });

  const tryDelete = () => {
    if (!canEdit) return;
    threadDeleteMutation.mutate();
  };

  const commentSave = (props: comment) => {
    if (!canComment) return;
    if (commentCreateMutation.isPending) return;
    commentCreateMutation.mutate(props);
  };

  const tryDeleteComment = (deleteCommentId: number) => {
    commentDeleteMutation.mutate(deleteCommentId);
  };

  const authorName = currentThread?.is_secret
    ? "익명"
    : getBoardPosterDisplayname(
        currentThread?.author?.profile,
        topicSettings?.level_moderator,
        session?.user
      );

  return (
    <FormProvider {...methods}>
      <div className="w-full flex flex-col gap-6">
        <article className="flex flex-col gap-4">
          <header className="flex flex-col gap-3 border-b border-border/60 pb-4">
            <h1 className="text-lg sm:text-xl font-semibold leading-snug break-words flex items-start gap-1.5">
              <ThreadBadges
                commentCount={currentThread?.comments?.length ?? 0}
                views={currentThread?.views ?? 0}
              />
              <span>{currentThread?.title}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">
                  {authorName}
                </span>
                {currentThread?.is_secret && (isAppAdmin || isAuthor) && (
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                    {getBoardPosterDisplayname(
                      currentThread?.author?.profile,
                      topicSettings?.level_moderator,
                      session?.user
                    )}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {dayjs(currentThread?.created_at)
                  .tz("Asia/Seoul")
                  .format("YY-MM-DD HH:mm")}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {currentThread?.views ?? 0}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                {currentThread?.comments.length ?? 0}
              </span>
              <Button
                type="button"
                onClick={copyCurrentUrl}
                size="sm"
                variant="ghost"
                className="ml-auto h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
                주소복사
              </Button>
            </div>
          </header>
          <div className="prose dark:prose-invert max-w-none py-2">
            <HTMLViewer
              htmlContent={currentThread?.content ?? ""}
              format={
                (currentThread?.content_format as "html" | "markdown") ?? "html"
              }
            />
          </div>
        </article>

        {topicSettings?.fullview_on_homepage &&
          currentThread &&
          (currentThread.action_url_1 || currentThread.action_url_2) &&
          (() => {
            const hasBoth =
              !!currentThread.action_url_1 && !!currentThread.action_url_2;
            return (
              <div
                className={
                  hasBoth
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                    : "flex justify-center"
                }
              >
                {currentThread.action_url_1 && (
                  <Button
                    asChild
                    size="lg"
                    className={`bg-rose-500 hover:bg-rose-600 text-white font-semibold ${
                      hasBoth ? "w-full" : "w-full sm:w-auto sm:min-w-[320px]"
                    }`}
                  >
                    <a
                      href={currentThread.action_url_1}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {currentThread.action_url_1_label || "바로가기"}
                      <span aria-hidden className="ml-1">
                        →
                      </span>
                    </a>
                  </Button>
                )}
                {currentThread.action_url_2 && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className={`font-semibold ${
                      hasBoth ? "w-full" : "w-full sm:w-auto sm:min-w-[320px]"
                    }`}
                  >
                    <a
                      href={currentThread.action_url_2}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {currentThread.action_url_2_label || "바로가기"}
                      <span aria-hidden className="ml-1">
                        →
                      </span>
                    </a>
                  </Button>
                )}
              </div>
            );
          })()}

        {(topicSettings?.use_upvote || topicSettings?.use_downvote) &&
          currentThread && (
            <VoteButtons
              thread_id={thread_id}
              topic_url={topic_url}
              upvotes={currentThread.upvotes ?? 0}
              downvotes={currentThread.downvotes ?? 0}
              showUpvote={topicSettings?.use_upvote ?? false}
              showDownvote={topicSettings?.use_downvote ?? false}
              userVote={
                (currentThread.votes?.find(
                  (v) => v.user_id === (session as any)?.user?.id
                )?.vote_type as "up" | "down") ?? null
              }
              upvoteCost={topicPoints.cost.upvote}
              downvoteCost={topicPoints.cost.downvote}
              canAffordUpvote={topicPoints.canAfford.upvote}
              canAffordDownvote={topicPoints.canAfford.downvote}
            />
          )}

        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>댓글</span>
            <span className="text-muted-foreground font-normal">
              {currentThread?.comments?.length ?? 0}
            </span>
          </div>
          {currentThread?.comments && currentThread.comments.length === 0 && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground bg-muted/30 rounded-lg">
              등록된 댓글이 없습니다.
            </div>
          )}
          {currentThread?.comments && currentThread.comments.length > 0 && (
            <ul className="flex flex-col bg-muted/30 rounded-lg divide-y divide-border/60 overflow-hidden">
              {map(currentThread.comments, (comment) => {
                const commenterName = currentThread?.is_secret
                  ? "익명"
                  : getBoardPosterDisplayname(
                      comment.author?.profile,
                      topicSettings?.level_moderator,
                      session?.user
                    );
                const isOptimistic = comment.id < 0;
                const canDelete =
                  !isOptimistic &&
                  comment.author?.profile?.displayname ===
                    (session as any)?.user?.displayname;
                return (
                  <li
                    className="group flex items-baseline gap-2 px-3 py-2 hover:bg-muted/50 transition-colors"
                    key={`comment*&*${comment.id}`}
                  >
                    <span className="text-xs font-semibold text-foreground shrink-0">
                      {commenterName}
                    </span>
                    {currentThread?.is_secret && (isAppAdmin || isAuthor) && (
                      <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded shrink-0">
                        {getBoardPosterDisplayname(
                          comment.author?.profile,
                          topicSettings?.level_moderator,
                          session?.user
                        )}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                      {dayjs(comment.created_at)
                        .tz("Asia/Seoul")
                        .format("MM-DD HH:mm")}
                    </span>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: comment.content ?? "",
                      }}
                      className="text-sm flex-1 min-w-0 break-words [&>p]:m-0 [&_*]:inline"
                    />
                    {canDelete && (
                      <ConfirmDialog
                        title="댓글 삭제"
                        description="댓글을 삭제하시려면 확인을 눌러주세요."
                        onConfirm={() => tryDeleteComment(comment.id)}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0 self-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">삭제</span>
                        </Button>
                      </ConfirmDialog>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        {session !== null && session !== undefined && canComment && (
          <Form onSubmit={commentSave} className="w-full">
            <div className="flex items-center gap-1 rounded-full border border-input bg-background pl-2 pr-1 py-1 focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-ring transition-colors">
              <Input
                name="content"
                validate={validateComment}
                placeholder="댓글을 입력하세요..."
                className="flex-1"
                inputClassName="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-9 px-2 bg-transparent"
                isErrorVislble={false}
              />
              <Button
                type="submit"
                disabled={commentBlocked || commentCreateMutation.isPending}
                aria-busy={commentCreateMutation.isPending}
                title={commentTitle}
                size="sm"
                className="rounded-full h-8 px-3 gap-1.5 shrink-0"
              >
                {commentCreateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                등록
              </Button>
            </div>
          </Form>
        )}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
          <Button
            type="button"
            onClick={goBackList}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={goEdit}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                편집
              </Button>
              <ConfirmDialog
                title="게시글 삭제"
                description="게시글을 삭제하시려면 확인을 눌러주세요."
                onConfirm={tryDelete}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={threadDeleteMutation.isPending}
                  aria-busy={threadDeleteMutation.isPending}
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  {threadDeleteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  삭제
                </Button>
              </ConfirmDialog>
            </div>
          )}
        </div>
        {topicSettings && !topicSettings.fullview_on_homepage && (
          <ThreadList
            page={page}
            category_name={category_name}
            topic_url={topic_url}
            thread_id={thread_id}
            search={search}
            column={column}
          />
        )}
      </div>
    </FormProvider>
  );
};
