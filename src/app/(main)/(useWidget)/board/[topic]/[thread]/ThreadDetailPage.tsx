"use client";

import type { ThreadWithProfile } from "@/app/api/threads/read";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { sessionGet, threadGet, topicSettingsGet } from "@/helpers/get";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import { redirect, useRouter } from "next/navigation";
import { getDisplayname, postJson, refreshCache } from "@/helpers/common";
import { ThreadList } from "@/components/4_templates/ThreadList";
import { useToast } from "@/components/ui/use-toast";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import type { threadDeleteProps } from "@/app/api/threads/delete";
import { ToastData } from "@/helpers/toastData";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import { FormProvider, useForm } from "react-hook-form";
import Form from "@/components/1_atoms/Form";
import { commentDefault } from "@/helpers/defaultValue";
import type { comment } from "@prisma/client";
import { validateComment } from "@/helpers/validate";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import { map } from "@/helpers/basic";
import type { CommentUpdateProps } from "@/app/api/threads/comment/update";
import CkeditorViewer from "@/components/1_atoms/CkeditorViewer";
import type { Session } from "next-auth";
import type { TopicSettings } from "@/app/api/topic/read";
// import useBoardAccessControl from "@/helpers/customHook/useBoardAccessContol";

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
    sessionGet
  );

  const { data: topicSettings } = useGetQuery<
    TopicSettings, // New type needed
    { topic_url: string }
  >(
    {
      queryKey: [{ [QueryKey.topicSettings]: { topic_url } }],
      staleTime: Infinity,
    },
    topicSettingsGet, // New API endpoint needed
    { topic_url }
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
    { topic_url, thread_id }
  );

  const authLevel = session?.user?.auth_level ?? 0;

  const levelRead = topicSettings?.level_read ?? 1;
  const levelComment = topicSettings?.level_comment ?? 1;
  const levelModerator = topicSettings?.level_moderator ?? 0;

  const isModerator = authLevel >= levelModerator;
  const isAppAdmin = session?.user?.is_app_admin;
  const isAuthor = currentThread?.author_id === session?.user?.id;

  const canRead = authLevel >= levelRead;
  const canEdit = isAppAdmin || isModerator || isAuthor;
  const canComment = authLevel >= levelComment;

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

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const tryDelete = async () => {
    if (!canEdit) return;
    setLoading();
    try {
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
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  const methods = useForm<comment>({
    defaultValues: commentDefault({ thread_id }),
    reValidateMode: "onSubmit",
  });

  const commentSave = async (props: comment) => {
    if (!canComment) return;
    setLoading();

    try {
      const { isSuccess, hasMessage } = await postJson<CommentUpdateProps>(
        ApiRoute.threadCommentUpdate,
        { ...props, topic_url }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        methods.reset(commentDefault({ thread_id }));
        refreshCache(queryClient, QueryKey.thread);
        refreshCache(queryClient, QueryKey.threads);
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  const tryDeleteComment = async (deleteCommentId: number) => {
    setLoading();
    try {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.threadCommentDelete,
        {
          deleteCommentId,
        }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        refreshCache(queryClient, QueryKey.thread);
        refreshCache(queryClient, QueryKey.threads);
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  return (
    <FormProvider {...methods}>
      <div className="w-full flex flex-col gap-4">
        <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b p-3 sm:p-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">
              {currentThread?.title}
            </h1>
            <CardDescription className="flex flex-wrap gap-2 sm:gap-4 items-center text-xs sm:text-sm md:text-base">
              <div className="flex items-center gap-1 sm:gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-500 sm:w-4 sm:h-4"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>
                  작성자{" "}
                  <b className="text-primary">
                    {getDisplayname(currentThread?.author?.profile)}
                  </b>
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-500 sm:w-4 sm:h-4"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>
                  작성일{" "}
                  <b>
                    {dayjs(currentThread?.created_at)
                      .tz("Asia/Seoul")
                      .format("YY-MM-DD HH:mm")}
                  </b>
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-500 sm:w-4 sm:h-4"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>
                  조회 <b>{currentThread?.views}회</b>
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-500 sm:w-4 sm:h-4"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>
                  댓글 <b>{currentThread?.comments.length}건</b>
                </span>
              </div>
              <Button
                type="button"
                onClick={copyCurrentUrl}
                className="ml-auto p-1.5 sm:p-2 h-fit flex items-center gap-1 sm:gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs sm:text-sm"
                variant="outline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="sm:w-4 sm:h-4"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                주소복사
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="prose dark:prose-invert max-w-none">
              <CkeditorViewer htmlContent={currentThread?.content ?? ""} />
            </div>
          </CardContent>
        </Card>

        {currentThread?.comments && currentThread?.comments.length === 0 && (
          <Card className="overflow-hidden border-none shadow-md">
            <CardContent className="flex items-center justify-center p-8 text-slate-500 dark:text-slate-400">
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
                className="mr-2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              등록된 댓글이 없습니다.
            </CardContent>
          </Card>
        )}
        {currentThread?.comments && currentThread?.comments.length > 0 && (
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b py-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                댓글 {currentThread.comments.length}건
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {map(currentThread.comments, (comment) => (
                <div
                  className="group flex flex-col gap-2 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b last:border-b-0"
                  key={`comment*&*${comment.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {getDisplayname(comment.author?.profile)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {dayjs(comment.created_at)
                          .tz("Asia/Seoul")
                          .format("YY-MM-DD HH:mm")}
                      </span>
                    </div>
                    {comment.author?.profile?.displayname ===
                      (session as any)?.user?.displayname && (
                      <ConfirmDialog
                        title="댓글 삭제"
                        description="댓글을 삭제하시려면 확인을 눌러주세요."
                        onConfirm={() => tryDeleteComment(comment.id)}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                          <span className="sr-only">삭제</span>
                        </Button>
                      </ConfirmDialog>
                    )}
                  </div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: comment.content ?? "",
                    }}
                    className="prose-sm dark:prose-invert max-w-none break-words text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {session !== null && session !== undefined && canComment && (
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b py-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                댓글 작성
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Form onSubmit={commentSave} className="space-y-4">
                <FormTextarea
                  name="content"
                  validate={validateComment}
                  label="댓글을 입력하세요"
                  placeholder="댓글을 입력하세요..."
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="px-4 bg-primary hover:bg-primary/90"
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
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    댓글 등록
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        )}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            onClick={goBackList}
            variant="outline"
            className="w-full sm:w-auto px-4"
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
              className=""
            >
              <path d="m12 19-7-7 7-7"></path>
              <path d="M19 12H5"></path>
            </svg>
            목록으로
          </Button>
          {canEdit && (
            <>
              <Button
                type="button"
                onClick={goEdit}
                className="w-full sm:w-auto px-4 bg-primary hover:bg-primary/90"
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
                  className="w-full sm:w-auto px-4"
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
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  삭제
                </Button>
              </ConfirmDialog>
            </>
          )}
        </div>
        <ThreadList
          page={page}
          category_name={category_name}
          topic_url={topic_url}
          thread_id={thread_id}
          search={search}
          column={column}
        />
      </div>
    </FormProvider>
  );
};
