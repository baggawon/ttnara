"use client";

import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import clsx from "clsx";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEditor, EditorContent } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ErrorMessage,
  type ValidateType,
} from "@/components/1_atoms/ErrorMessage";
import MediaUploader, {
  type MediaInsertPayload,
} from "@/components/2_molecules/Input/MediaUploader";
import type { MediaUploadResult } from "@/app/api/uploads/media";

type ContentFormat = "html" | "markdown";

const EXTENSION_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

const extensionsToMimes = (extensions: string[]): string[] => {
  const mimes = new Set<string>();
  for (const ext of extensions) {
    const mime = EXTENSION_TO_MIME[ext.trim().toLowerCase().replace(/^\./, "")];
    if (mime) mimes.add(mime);
  }
  return Array.from(mimes);
};

const VideoNode = Node.create({
  name: "video",
  group: "block",
  selectable: true,
  draggable: true,
  atom: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { controls: "controls" })];
  },
});

const toInitialHtml = (raw: string, format: ContentFormat): string => {
  if (!raw) return "";
  if (typeof window === "undefined") return raw;
  if (format === "html") return DOMPurify.sanitize(raw);
  const parsed = marked.parse(raw, { async: false }) as string;
  return DOMPurify.sanitize(parsed);
};

const isEmptyHtml = (html: string): boolean =>
  html === "" || html === "<p></p>";

export interface SimpleMarkdownEditorProps {
  name: string;
  formatName?: string;
  placeholder?: string;
  validate?: ValidateType;
  watchNames?: string[];
  isErrorVisible?: boolean;
  disabled?: boolean;
  minHeight?: number;
  className?: string;
  uploadEnabled?: boolean;
  uploadMaxItems?: number;
  uploadMaxSizeMb?: number;
  uploadAcceptedTypes?: string[];
  uploadAcceptedExtensions?: string[];
  uploadInitialItems?: MediaUploadResult[];
  uploadEnableThumbnailPicker?: boolean;
  uploadInitialThumbnailId?: number | null;
  uploadOnThumbnailChange?: (id: number | null) => void;
  uploadOnItemsChange?: (items: MediaUploadResult[]) => void;
}

const SimpleMarkdownEditor = ({
  name,
  formatName,
  placeholder = "내용을 입력하세요",
  validate,
  watchNames,
  isErrorVisible = true,
  disabled,
  minHeight = 320,
  className,
  uploadEnabled = true,
  uploadMaxItems,
  uploadMaxSizeMb,
  uploadAcceptedTypes,
  uploadAcceptedExtensions,
  uploadInitialItems,
  uploadEnableThumbnailPicker = false,
  uploadInitialThumbnailId = null,
  uploadOnThumbnailChange,
  uploadOnItemsChange,
}: SimpleMarkdownEditorProps) => {
  const { register, setValue, control, getValues } = useFormContext();

  register(name, {
    ...(validate && {
      validate: (value: any) => !validate(value),
    }),
  });
  if (formatName) register(formatName);

  const initialContent = useMemo(() => {
    const raw = (getValues(name) as string | undefined) ?? "";
    const fmt =
      formatName && getValues(formatName) === "html" ? "html" : "markdown";
    return toInitialHtml(raw, fmt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      VideoNode,
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: clsx(
          "prose dark:prose-invert max-w-none p-3 text-sm leading-relaxed",
          "focus:outline-none",
          disabled && "opacity-60 pointer-events-none"
        ),
        style: `min-height: ${minHeight}px;`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setValue(name, isEmptyHtml(html) ? "" : html, { shouldDirty: true });
      if (formatName) {
        setValue(formatName, "html", { shouldDirty: true });
      }
    },
  });

  const formValue: string =
    useWatch({ control, name, defaultValue: getValues(name) ?? "" }) ?? "";

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = formValue || "";
    if (incoming === current) return;
    if (incoming === "" && isEmptyHtml(current)) return;
    editor.commands.setContent(incoming, { emitUpdate: false });
  }, [editor, formValue]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const handleInsert = (payload: MediaInsertPayload) => {
    if (!editor) return;
    if (payload.mediaType === "video") {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "video",
          attrs: { src: payload.url },
        })
        .run();
    } else {
      editor.chain().focus().setImage({ src: payload.url, alt: "" }).run();
    }
  };

  // When an item is dropped from the uploader, strip every copy of it from the
  // body too. Match on the unsigned CloudFront base (`awsCloudFrontUrl`) since
  // the body may hold a differently-signed variant of the same asset.
  const handleMediaRemove = (item: MediaUploadResult) => {
    if (!editor) return;
    const needle = item.awsCloudFrontUrl || item.url;
    if (!needle) return;
    const { state } = editor;
    const ranges: { from: number; to: number }[] = [];
    state.doc.descendants((node, pos) => {
      if (node.type.name === "image" || node.type.name === "video") {
        const src = (node.attrs.src as string) ?? "";
        if (src === item.url || src.includes(needle)) {
          ranges.push({ from: pos, to: pos + node.nodeSize });
        }
      }
      return true;
    });
    if (ranges.length === 0) return;
    const tr = state.tr;
    // Delete back-to-front so earlier deletions don't shift later positions.
    ranges
      .sort((a, b) => b.from - a.from)
      .forEach(({ from, to }) => tr.delete(from, to));
    editor.view.dispatch(tr);
  };

  const promptLink = () => {
    if (!editor) return;
    const previousUrl = (editor.getAttributes("link").href as string) ?? "";
    const url = window.prompt("URL 입력", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <div className="border rounded-md overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={!!editor?.isActive("bold")}
            disabled={disabled}
            title="굵게"
          >
            <BoldIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={!!editor?.isActive("italic")}
            disabled={disabled}
            title="기울임"
          >
            <ItalicIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            isActive={!!editor?.isActive("strike")}
            disabled={disabled}
            title="취소선"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={!!editor?.isActive("heading", { level: 1 })}
            disabled={disabled}
            title="제목 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={!!editor?.isActive("heading", { level: 2 })}
            disabled={disabled}
            title="제목 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={!!editor?.isActive("heading", { level: 3 })}
            disabled={disabled}
            title="제목 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={!!editor?.isActive("bulletList")}
            disabled={disabled}
            title="글머리 기호"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={!!editor?.isActive("orderedList")}
            disabled={disabled}
            title="번호 매기기"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton
            onClick={promptLink}
            isActive={!!editor?.isActive("link")}
            disabled={disabled}
            title="링크"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().unsetLink().run()}
            disabled={disabled || !editor?.isActive("link")}
            title="링크 제거"
          >
            <Unlink className="w-4 h-4" />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} />
      </div>

      {uploadEnabled && (
        <MediaUploader
          onInsert={handleInsert}
          onRemove={handleMediaRemove}
          initialItems={uploadInitialItems}
          maxSizeMb={uploadMaxSizeMb}
          maxItems={uploadMaxItems}
          acceptedTypes={
            uploadAcceptedTypes ??
            (uploadAcceptedExtensions
              ? extensionsToMimes(uploadAcceptedExtensions)
              : undefined)
          }
          disabled={disabled}
          enableThumbnailPicker={uploadEnableThumbnailPicker}
          initialThumbnailId={uploadInitialThumbnailId}
          onThumbnailChange={uploadOnThumbnailChange}
          onItemsChange={uploadOnItemsChange}
        />
      )}

      {validate && (
        <ErrorMessage
          name={name}
          validate={validate}
          watchNames={watchNames}
          isErrorVislble={isErrorVisible}
        />
      )}
    </div>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton = ({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: ToolbarButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={clsx(
      "h-8 w-8 p-0",
      isActive && "bg-accent text-accent-foreground"
    )}
  >
    {children}
  </Button>
);

const ToolbarSeparator = () => (
  <div className="w-px self-stretch bg-border mx-1" />
);

export default SimpleMarkdownEditor;
