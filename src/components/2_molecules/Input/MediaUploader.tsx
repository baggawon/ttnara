"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Loader2, Trash2, ImagePlay, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import DashedCard from "@/components/1_atoms/DashedCard";
import { useToast } from "@/components/ui/use-toast";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute } from "@/helpers/types";
import { version } from "@/helpers/config";
import type { MediaUploadResult } from "@/app/api/uploads/media";

const DEFAULT_ACCEPTED_MIME = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const DEFAULT_MAX_SIZE_MB = 20;

export type MediaInsertPayload = MediaUploadResult & {
  markdown: string;
};

export interface MediaUploaderProps {
  onInsert: (payload: MediaInsertPayload) => void;
  // Fired when an item is removed from the list, so the host editor can also
  // strip any copies the user inserted into the body — otherwise the media
  // disappears from the uploader but lingers in the rendered post.
  onRemove?: (item: MediaUploadResult) => void;
  onItemsChange?: (items: MediaUploadResult[]) => void;
  initialItems?: MediaUploadResult[];
  maxSizeMb?: number;
  maxItems?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  enableThumbnailPicker?: boolean;
  initialThumbnailId?: number | null;
  onThumbnailChange?: (id: number | null) => void;
}

const buildMarkdown = (item: MediaUploadResult): string =>
  item.mediaType === "video"
    ? `<video src="${item.url}" controls></video>`
    : `![](${item.url})`;

const MediaUploader = ({
  onInsert,
  onRemove,
  onItemsChange,
  initialItems,
  maxSizeMb = DEFAULT_MAX_SIZE_MB,
  maxItems,
  acceptedTypes = DEFAULT_ACCEPTED_MIME,
  className,
  disabled,
  enableThumbnailPicker = false,
  initialThumbnailId = null,
  onThumbnailChange,
}: MediaUploaderProps) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaUploadResult[]>(initialItems ?? []);
  const [uploading, setUploading] = useState(false);
  const [thumbnailId, setThumbnailId] = useState<number | null>(
    initialThumbnailId
  );
  const seededRef = useRef<boolean>(!!initialItems);
  const thumbSeededRef = useRef<boolean>(initialThumbnailId != null);

  useEffect(() => {
    if (seededRef.current) return;
    if (!initialItems || initialItems.length === 0) return;
    setItems(initialItems);
    seededRef.current = true;
  }, [initialItems]);

  useEffect(() => {
    if (thumbSeededRef.current) return;
    if (initialThumbnailId == null) return;
    setThumbnailId(initialThumbnailId);
    thumbSeededRef.current = true;
  }, [initialThumbnailId]);

  const setThumbnail = (id: number | null) => {
    setThumbnailId(id);
    onThumbnailChange?.(id);
  };

  const reconcileThumbnail = (next: MediaUploadResult[]) => {
    if (!enableThumbnailPicker) return;
    const images = next.filter((i) => i.mediaType === "image");
    if (images.length === 0) {
      if (thumbnailId != null) setThumbnail(null);
      return;
    }
    const currentStillPresent =
      thumbnailId != null && images.some((i) => i.id === thumbnailId);
    if (!currentStillPresent) {
      setThumbnail(images[0].id);
    }
  };

  const updateItems = (next: MediaUploadResult[]) => {
    setItems(next);
    onItemsChange?.(next);
    reconcileThumbnail(next);
  };

  const uploadOne = async (file: File): Promise<MediaUploadResult | null> => {
    if (!acceptedTypes.includes(file.type)) {
      toast({ id: ToastData.attachedTypeLimit, type: "error" });
      return null;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast({
        id: ToastData.attachedSizeLimit,
        type: "error",
        value: String(maxSizeMb),
      });
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("version", version);

    const res = await fetch(ApiRoute.uploadsMedia, {
      method: "POST",
      body: formData,
    });
    const json = (await res.json()) as {
      result: boolean;
      message?: string;
      data?: MediaUploadResult;
    };
    if (!json.result || !json.data) {
      if (json.message) console.warn("media upload failed:", json.message);
      toast({ id: ToastData.unknown, type: "error" });
      return null;
    }
    return json.data;
  };

  const ingestFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const cap = maxItems ?? Infinity;
    if (items.length >= cap) {
      toast({ id: ToastData.attachedCountLimit, type: "error" });
      return;
    }
    const remainingSlots = cap - items.length;
    const accepted = files.slice(0, remainingSlots);
    if (files.length > accepted.length) {
      toast({ id: ToastData.attachedCountLimit, type: "error" });
    }
    setUploading(true);
    const next: MediaUploadResult[] = [...items];
    for (const file of accepted) {
      const result = await uploadOne(file);
      if (result) next.push(result);
    }
    updateItems(next);
    setUploading(false);
  };

  const onFileInput: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (!event.target.files) return;
    void ingestFiles(Array.from(event.target.files));
    event.target.value = "";
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    if (disabled || uploading) return;
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) void ingestFiles(files);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
  };

  const removeLocal = (id: number) => {
    const removed = items.find((i) => i.id === id);
    updateItems(items.filter((i) => i.id !== id));
    if (removed) onRemove?.(removed);
  };

  const handleThumbClick = (item: MediaUploadResult) => {
    onInsert({ ...item, markdown: buildMarkdown(item) });
  };

  const atCap = maxItems !== undefined && items.length >= maxItems;
  const pickerDisabled = disabled || uploading || atCap;

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">
          미디어 업로드
          {maxItems !== undefined && (
            <span className="ml-2 text-xs text-black/40">
              ({items.length}/{maxItems})
            </span>
          )}
        </Label>
        <Label
          htmlFor="media-uploader-input"
          className={clsx(
            buttonVariants({ variant: "outline", size: "sm" }),
            "cursor-pointer",
            pickerDisabled && "opacity-50 pointer-events-none"
          )}
        >
          파일 선택
          <input
            ref={inputRef}
            id="media-uploader-input"
            type="file"
            className="hidden"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={onFileInput}
            disabled={pickerDisabled}
          />
        </Label>
      </div>

      <DashedCard
        className={clsx(
          "min-h-[120px]",
          (disabled || uploading) && "opacity-70"
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {items.length === 0 && !uploading && (
          <p className="absolute inset-0 flex items-center justify-center text-black/30 font-medium">
            여기에 이미지/동영상을 드래그하거나 파일을 선택하세요
          </p>
        )}
        {uploading && (
          <p className="absolute inset-0 flex items-center justify-center text-black/40 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> 업로드 중...
          </p>
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative group aspect-square border rounded-md overflow-hidden bg-neutral-50"
              >
                <button
                  type="button"
                  onClick={() => handleThumbClick(item)}
                  disabled={disabled}
                  className="block w-full h-full"
                  title="클릭하여 본문에 삽입"
                >
                  {item.mediaType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      <ImagePlay className="w-8 h-8" />
                    </div>
                  )}
                </button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeLocal(item.id)}
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="목록에서 제거"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                {enableThumbnailPicker && item.mediaType === "image" && (
                  <Button
                    type="button"
                    variant={thumbnailId === item.id ? "default" : "secondary"}
                    size="icon"
                    onClick={() => setThumbnail(item.id)}
                    className={clsx(
                      "absolute top-1 left-1 h-6 w-6 transition-opacity",
                      thumbnailId === item.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                    title={
                      thumbnailId === item.id ? "현재 썸네일" : "썸네일로 지정"
                    }
                  >
                    <Star
                      className={clsx(
                        "w-3 h-3",
                        thumbnailId === item.id && "fill-current"
                      )}
                    />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DashedCard>

      <ul className="text-xs text-black/50 list-disc list-inside space-y-0.5">
        <li>썸네일을 클릭하면 본문 커서 위치에 이미지가 삽입됩니다.</li>
        {enableThumbnailPicker && (
          <li>
            별
            <Star className="inline w-3 h-3 align-text-bottom mx-0.5" />
            아이콘을 누르면 해당 이미지를 목록 화면 썸네일로 지정합니다.
            지정하지 않으면 첫 번째 업로드 이미지가 자동으로 썸네일이 됩니다.
          </li>
        )}
        <li>
          업로드 후 본문에 사용하지 않고{" "}
          {enableThumbnailPicker && "썸네일로도 지정하지 않은 "}
          이미지는 저장 시 자동으로 삭제됩니다.
        </li>
        <li>최대 {maxSizeMb}MB</li>
      </ul>
    </div>
  );
};

export default MediaUploader;
