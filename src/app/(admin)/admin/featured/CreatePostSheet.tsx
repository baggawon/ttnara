"use client";

import type { AmadoEventWithLocal } from "@/app/api/admin_di2u3k2j/amado/events/read";
import type { FeaturedPostReadResult } from "@/app/api/admin_di2u3k2j/featured/post/read";
import type { FeaturedPostUpdateProps } from "@/app/api/admin_di2u3k2j/featured/post/update";
import type { MediaUploadResult } from "@/app/api/uploads/media";
import type { UploadSettings } from "@/app/(admin)/admin/featured/FeaturedManager";
import Form from "@/components/1_atoms/Form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import SelectInput from "@/components/2_molecules/Input/Select";
import SimpleMarkdownEditor from "@/components/2_molecules/Input/SimpleMarkdownEditor";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { postJson } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminFeaturedPostGet } from "@/helpers/get";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";
import type { FeaturedPostCreateProps } from "@/app/api/admin_di2u3k2j/featured/post/create";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { Calendar, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

dayjs.locale("ko");

export interface CreatePostFormValues {
  title: string;
  description: string;
  // String form because <SelectInput> stores the option value verbatim; convert
  // back via `Number(...)` when persisting.
  category_id: string;
  content: string;
  content_format: "markdown" | "html";
  thumbnail_media_id: number | null;
  action_url_1: string;
  action_url_1_label: string;
  action_url_2: string;
  action_url_2_label: string;
  is_featured: boolean;
}

export type SheetMode = "create" | "edit";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SheetMode;
  event: AmadoEventWithLocal | null;
  // When in edit mode, the existing post id to load + update.
  existingPostId?: number | null;
  topicCategories: { id: number; name: string }[];
  uploadSettings: UploadSettings;
  onSaved?: () => void;
}

// Anything uploaded that didn't end up in the body or as the thumbnail is
// "orphaned" and should be cleaned up server-side on save.
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

const buildCreateDefaults = (
  event: AmadoEventWithLocal | null,
  topicCategories: { id: number; name: string }[]
): CreatePostFormValues => {
  // Match by exact category name. If the topic doesn't have a matching
  // category yet (the missing-categories scenario), leave it blank so the
  // admin can either pick manually or run the auto-create flow first.
  const matched = event
    ? topicCategories.find((c) => c.name === event.category)
    : undefined;
  return {
    title: event?.title ?? "",
    description: "",
    category_id: matched ? String(matched.id) : "",
    content: "",
    content_format: "markdown",
    thumbnail_media_id: null,
    // Mirrors the existing home-block design: action_url_1 is the primary CTA
    // back to the Amado event. Admin can edit or clear.
    action_url_1: event?.detail_url ?? "",
    action_url_1_label: "Amado 바로가기",
    action_url_2: "",
    action_url_2_label: "",
    is_featured: false,
  };
};

const buildEditDefaults = (
  loaded: FeaturedPostReadResult
): CreatePostFormValues => {
  const p = loaded.post;
  return {
    title: p.title ?? "",
    description: p.description ?? "",
    category_id: p.category_id != null ? String(p.category_id) : "",
    content: p.content ?? "",
    content_format: (p.content_format as "markdown" | "html") ?? "markdown",
    thumbnail_media_id: p.thumbnail_media_id ?? null,
    action_url_1: p.action_url_1 ?? "",
    action_url_1_label: p.action_url_1_label ?? "",
    action_url_2: p.action_url_2 ?? "",
    action_url_2_label: p.action_url_2_label ?? "",
    is_featured: !!p.is_featured,
  };
};

export const CreatePostSheet = ({
  open,
  onOpenChange,
  mode,
  event,
  existingPostId,
  topicCategories,
  uploadSettings,
  onSaved,
}: Props) => {
  const { toast } = useToast();
  const isEdit = mode === "edit";
  const methods = useForm<CreatePostFormValues>({
    defaultValues: buildCreateDefaults(event, topicCategories),
    reValidateMode: "onSubmit",
  });
  // Mirrors the ThreadEdit pattern: editor reports uploads here, we recompute
  // which ones aren't actually referenced when submitting, and forward those
  // ids to the server for cleanup.
  const [mediaItems, setMediaItems] = useState<MediaUploadResult[]>([]);
  const [initialAttachedMedia, setInitialAttachedMedia] = useState<
    MediaUploadResult[]
  >([]);

  // In edit mode, pull the existing post + attached media so the form can
  // pre-populate. Gated on `open` so we don't fetch while the sheet is closed.
  const enableEditFetch = open && isEdit && (existingPostId ?? 0) > 0;
  const { data: loaded } = useGetQuery<FeaturedPostReadResult, { id: number }>(
    {
      queryKey: [{ [QueryKey.adminFeaturedPost]: { id: existingPostId ?? 0 } }],
      enabled: enableEditFetch,
      staleTime: 0,
    },
    adminFeaturedPostGet,
    { id: existingPostId ?? 0 },
    { silent: true }
  );

  // Reset form when picking a new event (create mode) or when edit data
  // arrives. Also clear local media so uploads from prior drafts don't leak.
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (loaded) {
        methods.reset(buildEditDefaults(loaded));
        setInitialAttachedMedia(loaded.attachedMedia);
        setMediaItems(loaded.attachedMedia);
      }
    } else if (event) {
      methods.reset(buildCreateDefaults(event, topicCategories));
      setInitialAttachedMedia([]);
      setMediaItems([]);
    }
  }, [open, isEdit, loaded, event, topicCategories, methods]);

  const allowedExtensions = uploadSettings.allowed_file_extensions
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const handleThumbnailChange = (id: number | null) => {
    methods.setValue("thumbnail_media_id", id, { shouldDirty: true });
  };

  const [submitting, setSubmitting] = useState(false);

  const submit = async (values: CreatePostFormValues) => {
    if (submitting) return;
    if (!isEdit && !event) return;
    if (isEdit && !existingPostId) return;
    setSubmitting(true);
    try {
      const unused = computeUnusedMedia(
        mediaItems,
        values.content,
        values.thumbnail_media_id
      );
      if (isEdit) {
        const payload: FeaturedPostUpdateProps = {
          id: existingPostId!,
          title: values.title,
          description: values.description,
          content: values.content,
          content_format: values.content_format,
          category_id: values.category_id,
          thumbnail_media_id: values.thumbnail_media_id,
          action_url_1: values.action_url_1,
          action_url_1_label: values.action_url_1_label,
          action_url_2: values.action_url_2,
          action_url_2_label: values.action_url_2_label,
          is_featured: values.is_featured,
          unused_media_ids: unused.map((m) => m.id),
        };
        const { isSuccess, hasMessage } =
          await postJson<FeaturedPostUpdateProps>(
            ApiRoute.adminFeaturedPostUpdate,
            payload
          );
        if (isSuccess) {
          toast({ id: "게시글이 수정되었습니다.", type: "success" });
          onSaved?.();
          onOpenChange(false);
        } else {
          toast({ id: hasMessage ?? ToastData.unknown, type: "error" });
        }
      } else {
        const payload: FeaturedPostCreateProps = {
          amado_event_id: event!.id,
          title: values.title,
          description: values.description,
          content: values.content,
          content_format: values.content_format,
          category_id: values.category_id,
          thumbnail_media_id: values.thumbnail_media_id,
          action_url_1: values.action_url_1,
          action_url_1_label: values.action_url_1_label,
          action_url_2: values.action_url_2,
          action_url_2_label: values.action_url_2_label,
          is_featured: values.is_featured,
          unused_media_ids: unused.map((m) => m.id),
        };
        const { isSuccess, hasMessage } =
          await postJson<FeaturedPostCreateProps>(
            ApiRoute.adminFeaturedPostCreate,
            payload
          );
        if (isSuccess) {
          toast({ id: "게시글이 작성되었습니다.", type: "success" });
          onSaved?.();
          onOpenChange(false);
        } else {
          toast({ id: hasMessage ?? ToastData.unknown, type: "error" });
        }
      }
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setSubmitting(false);
  };

  const handleError = () => {
    toast({ id: ToastData.unknown, type: "error" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        // Force the sheet wide. Default variant caps at sm:max-w-sm (~384px);
        // here we want as much room as possible since the form is dense.
        className="w-full sm:max-w-none sm:w-[95vw] lg:w-[90vw] xl:w-[1200px] p-0 flex flex-col"
        // Only the in-sheet X button or footer Cancel may close the modal —
        // suppress click-outside and ESC dismissals so admins don't lose work.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>{isEdit ? "게시글 수정" : "게시글 만들기"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "선택한 이벤트와 연결된 카드형 홈 게시글을 수정합니다."
              : "선택한 이벤트를 기반으로 카드형 홈 게시글을 작성합니다."}
          </SheetDescription>
        </SheetHeader>

        <FormProvider {...methods}>
          <Form
            onSubmit={submit}
            onError={handleError}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              {event && <EventReferenceCard event={event} />}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormBuilder name="title" label="제목">
                  <FormInput
                    name="title"
                    placeholder="제목을 입력하세요"
                    required
                    minLength={2}
                    maxLength={255}
                  />
                </FormBuilder>

                <FormBuilder name="category_id" label="카드 카테고리">
                  <SelectInput
                    name="category_id"
                    placeholder={
                      topicCategories.length === 0
                        ? "카테고리가 없습니다"
                        : "카테고리 선택"
                    }
                    items={topicCategories.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    buttonClassName="w-full"
                    disabled={topicCategories.length === 0}
                  />
                </FormBuilder>
              </div>

              <FormBuilder name="description" label="카드 설명">
                <FormTextarea
                  name="description"
                  placeholder="홈/게시판 카드에 노출되는 짧은 설명 (최대 300자)"
                />
              </FormBuilder>

              <FormBuilder name="content" label="본문">
                <SimpleMarkdownEditor
                  name="content"
                  formatName="content_format"
                  uploadEnabled={uploadSettings.use_upload_file}
                  uploadMaxItems={uploadSettings.max_upload_items}
                  uploadMaxSizeMb={uploadSettings.max_file_size_mb}
                  uploadAcceptedExtensions={allowedExtensions}
                  uploadInitialItems={isEdit ? initialAttachedMedia : undefined}
                  uploadEnableThumbnailPicker={uploadSettings.use_thumbnail}
                  uploadInitialThumbnailId={
                    isEdit ? (loaded?.post.thumbnail_media_id ?? null) : null
                  }
                  uploadOnThumbnailChange={handleThumbnailChange}
                  uploadOnItemsChange={setMediaItems}
                />
              </FormBuilder>

              <div className="rounded-lg border p-4 flex flex-col gap-3">
                <div className="text-sm font-medium">액션 버튼</div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
                  <FormBuilder name="action_url_1" label="액션 URL 1">
                    <FormInput name="action_url_1" placeholder="https://..." />
                  </FormBuilder>
                  <FormBuilder
                    name="action_url_1_label"
                    label="URL 1 버튼 라벨"
                  >
                    <FormInput
                      name="action_url_1_label"
                      placeholder="예: Amado 바로가기"
                      maxLength={50}
                    />
                  </FormBuilder>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
                  <FormBuilder name="action_url_2" label="액션 URL 2 (선택)">
                    <FormInput name="action_url_2" placeholder="https://..." />
                  </FormBuilder>
                  <FormBuilder
                    name="action_url_2_label"
                    label="URL 2 버튼 라벨"
                  >
                    <FormInput
                      name="action_url_2_label"
                      placeholder="예: 관련 뉴스 보기"
                      maxLength={50}
                    />
                  </FormBuilder>
                </div>
              </div>

              <FormBuilder name="is_featured" label="운영자 PICK (캐러셀 노출)">
                <div className="flex items-center gap-3">
                  <SwitchInput name="is_featured" />
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />홈 상단
                    캐러셀에 노출됩니다.
                  </span>
                </div>
              </FormBuilder>
            </div>

            <SheetFooter className="px-6 py-4 border-t bg-background gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                )}
                {isEdit ? "수정" : "저장"}
              </Button>
            </SheetFooter>
          </Form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};

const EventReferenceCard = ({ event }: { event: AmadoEventWithLocal }) => {
  const mot = event.moment_of_truth ? dayjs(event.moment_of_truth) : null;
  return (
    <Card className="bg-muted/40 border-dashed">
      <CardContent className="p-3 flex flex-col gap-1.5">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          참고 · Amado 이벤트
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-background border">
            {event.category}
          </span>
          <span className="text-sm font-medium">{event.title}</span>
        </div>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {mot ? `${mot.format("YYYY-MM-DD HH:mm")} · ` : ""}
          {event.id}
        </div>
      </CardContent>
    </Card>
  );
};
