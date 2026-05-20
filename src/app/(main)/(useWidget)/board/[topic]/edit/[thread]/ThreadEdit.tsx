"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FormProvider, useWatch } from "react-hook-form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { validateToipcName } from "@/helpers/validate";
import { useThreadsEditHook } from "@/app/(main)/(useWidget)/board/[topic]/edit/[thread]/hook";
import SelectInput from "@/components/2_molecules/Input/Select";
import { map } from "@/helpers/basic";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import type { ThreadWithProfile } from "@/app/api/threads/read";
import { useSession } from "next-auth/react";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { useState, type ReactNode } from "react";
import SimpleMarkdownEditor from "@/components/2_molecules/Input/SimpleMarkdownEditor";
import type { MediaUploadResult } from "@/app/api/uploads/media";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ThreadSubmitPayload = ThreadWithProfile & {
  unused_media_ids?: number[];
};

const computeUnusedMedia = (
  items: MediaUploadResult[],
  content: string | null | undefined,
  thumbnailId: number | null | undefined
): MediaUploadResult[] => {
  const body = content ?? "";
  return items.filter((item) => {
    const inBody = body.includes(item.awsCloudFrontUrl);
    const isThumbnail = thumbnailId != null && item.id === thumbnailId;
    return !inBody && !isThumbnail;
  });
};

const AdminToolRow = ({
  icon,
  title,
  description,
  control,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  control: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md bg-white dark:bg-slate-900/60 border border-amber-100 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors">
    <div className="flex items-center gap-3 min-w-0">
      <div className="shrink-0 w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {description}
        </div>
      </div>
    </div>
    <div className="shrink-0">{control}</div>
  </div>
);

export const ThreadEditor = ({
  topic_url,
  thread_id,
}: {
  topic_url: string;
  thread_id: number;
}) => {
  const { methods, topicSettings, attachedMedia, goBackList, submit } =
    useThreadsEditHook(topic_url, thread_id);

  const session = useSession();

  const [mediaItems, setMediaItems] = useState<MediaUploadResult[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState<{
    data: ThreadWithProfile;
    unused: MediaUploadResult[];
  } | null>(null);

  const submitWithCleanup = (
    data: ThreadWithProfile,
    unused: MediaUploadResult[]
  ) => {
    const payload: ThreadSubmitPayload = {
      ...data,
      unused_media_ids: unused.map((i) => i.id),
    };
    return submit(payload as ThreadWithProfile);
  };

  const handleSubmit = (data: ThreadWithProfile) => {
    const unused = computeUnusedMedia(
      mediaItems,
      data.content,
      data.thumbnail_media_id
    );
    if (unused.length > 0) {
      setPendingSubmit({ data, unused });
      return;
    }
    return submitWithCleanup(data, []);
  };

  const confirmAndSubmit = () => {
    if (!pendingSubmit) return;
    const { data, unused } = pendingSubmit;
    setPendingSubmit(null);
    void submitWithCleanup(data, unused);
  };

  const watchedThumbnailId = useWatch({
    control: methods.control,
    name: "thumbnail_media_id",
  }) as number | null | undefined;
  const initialThumbnailId = watchedThumbnailId ?? null;
  const handleThumbnailChange = (id: number | null) => {
    methods.setValue("thumbnail_media_id", id, { shouldDirty: true });
  };

  return (
    <FormProvider {...methods}>
      <Form onSubmit={handleSubmit}>
        <section className="w-full flex flex-col gap-6 p-0 md:p-4 max-w-5xl mx-auto">
          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b p-3 sm:p-6">
              <WithUseWatch name={["id"]}>
                {({ id }: ThreadWithProfile) => (
                  <div className="flex items-center gap-2">
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
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <h1 className="text-xl sm:text-2xl font-bold">
                      {topicSettings?.name} -
                      {id === 0 ? " 새 글 작성" : " 글 수정"}
                    </h1>
                  </div>
                )}
              </WithUseWatch>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="p-3 sm:p-6 flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-[200px]">
                  <FormBuilder
                    name="category_id"
                    label="카테고리"
                    formClassName="w-full"
                  >
                    <SelectInput
                      name="category_id"
                      placeholder={
                        topicSettings?.categories?.length
                          ? "카테고리 선택"
                          : "없음"
                      }
                      items={
                        topicSettings?.categories
                          ? map(topicSettings.categories, (category) => ({
                              label: category.name,
                              value: category.id,
                            }))
                          : []
                      }
                      buttonClassName="w-full"
                      disabled={!topicSettings?.categories?.length}
                    />
                  </FormBuilder>
                </div>
                <div className="w-full flex-1">
                  <FormInput
                    name="title"
                    label="제목"
                    validate={validateToipcName}
                    placeholder="제목을 입력하세요"
                  />
                </div>
              </div>

              {(() => {
                const isAdmin = !!session?.data?.user?.is_app_admin;
                const canModerate =
                  isAdmin ||
                  (session?.data?.user?.auth_level ?? 0) >=
                    (topicSettings?.level_moderator ?? 0);
                const showAnonymousToggle =
                  !!topicSettings?.use_anonymous && canModerate;
                const showPin = isAdmin;
                const showPush = isAdmin && thread_id === 0;

                if (!showPin && !showPush && !showAnonymousToggle) {
                  return null;
                }

                return (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
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
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </span>
                        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                          관리자 부가기능
                        </h3>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        Admin
                      </span>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2">
                      {showPin && (
                        <AdminToolRow
                          icon={
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
                              <path d="M5 3h14" />
                              <path d="m18 13-6-6-6 6" />
                              <path d="M12 7v14" />
                            </svg>
                          }
                          title="상단에 고정"
                          description="이 게시글을 목록 상단의 공지로 표시합니다."
                          control={<SwitchInput name="is_notice" />}
                        />
                      )}
                      {showPush && (
                        <AdminToolRow
                          icon={
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
                              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            </svg>
                          }
                          title="푸쉬로 알림"
                          description="저장 시 구독자에게 푸시 알림을 보냅니다."
                          control={<SwitchInput name="is_push_notify" />}
                        />
                      )}
                      {showAnonymousToggle && (
                        <AdminToolRow
                          icon={
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
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                              <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          }
                          title="익명 해제"
                          description="익명 게시판이지만 작성자 정보를 공개합니다."
                          control={
                            <SwitchInput
                              name="is_secret"
                              onChecked={(v) => !v}
                            />
                          }
                        />
                      )}
                    </div>
                  </div>
                );
              })()}

              <FormBuilder
                name="content"
                label={
                  <div className="flex items-center gap-2 mb-2">
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
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    본문 작성
                  </div>
                }
              >
                <SimpleMarkdownEditor
                  name="content"
                  formatName="content_format"
                  validate={validateToipcName}
                  uploadEnabled={topicSettings?.use_upload_file ?? false}
                  uploadMaxItems={topicSettings?.max_upload_items ?? 5}
                  uploadMaxSizeMb={topicSettings?.max_file_size_mb ?? 20}
                  uploadAcceptedExtensions={topicSettings?.allowed_file_extensions
                    ?.split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)}
                  uploadInitialItems={attachedMedia ?? undefined}
                  uploadEnableThumbnailPicker={
                    topicSettings?.use_thumbnail ?? false
                  }
                  uploadInitialThumbnailId={initialThumbnailId}
                  uploadOnThumbnailChange={handleThumbnailChange}
                  uploadOnItemsChange={setMediaItems}
                />
              </FormBuilder>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              onClick={goBackList}
              variant="outline"
              className="px-4"
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
                className=""
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              저장
            </Button>
          </div>
        </section>
      </Form>

      <AlertDialog
        open={pendingSubmit !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSubmit(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사용하지 않은 이미지 삭제</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              본문에 사용되지 않았고 썸네일로도 지정되지 않은 이미지{" "}
              {pendingSubmit?.unused.length ?? 0}장이 저장 시 영구 삭제됩니다.
              계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingSubmit && pendingSubmit.unused.length > 0 && (
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {pendingSubmit.unused.map((item) => (
                <div
                  key={item.id}
                  className="aspect-square border rounded-md overflow-hidden bg-neutral-50"
                >
                  {item.mediaType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                      video
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndSubmit}>
              삭제하고 저장
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
};
