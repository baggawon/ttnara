"use client"; // only in App Router
import DOMPurify from "dompurify";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  AccessibilityHelp,
  Alignment,
  AutoImage,
  Autosave,
  Bold,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  ImageBlock,
  ImageInsert,
  ImageInsertViaUrl,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  MediaEmbed,
  Paragraph,
  PasteFromOffice,
  SelectAll,
  SimpleUploadAdapter,
  Strikethrough,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  Underline,
  Undo,
  Base64UploadAdapter,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";
import "ckeditor5-premium-features/ckeditor5-premium-features.css";
import { useRef } from "react";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import { ErrorMessage } from "@/components/1_atoms/ErrorMessage";
import WithRegister from "@/components/2_molecules/WithRegister";
import { convertId } from "@/helpers/common";
import translations from "@/components/1_atoms/ko";
import VideoUploadPlugin from "@/components/2_molecules/Input/CkeditorPlugins/VideoUploadPlugin";

const Ckeditor5Input = ({
  placeholder = "값을 선택해주세요",
  name,
  validate,
  onChange,
  buttonClassName,
  contentClassName,
  disabled,
  valueDecoration,
  watchNames,
  isErrorVislble = true,
  onOpenChange,
  open,
  readOnly,
  useUpload,
  ...props
}: {
  placeholder?: string;
  name: string;
  validate?: ValidateType;
  onChange?: (value: any) => void;
  buttonClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  valueDecoration?: string;
  watchNames?: string[];
  isErrorVislble?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  readOnly?: boolean;
  useUpload?: boolean;
  "data-testid"?: string;
}) => {
  const Ckeditor = useRef<ClassicEditor | undefined>(undefined);
  const first = useRef(true);
  return (
    <WithRegister name={name} validate={validate} watchNames={watchNames}>
      {(field) => (
        <div ref={field.ref} id={convertId(field.name)}>
          <CKEditor
            editor={ClassicEditor}
            config={{
              licenseKey: "GPL", // Or 'GPL'.
              plugins: [
                AccessibilityHelp,
                Alignment,
                AutoImage,
                Autosave,
                Bold,
                Essentials,
                FontBackgroundColor,
                FontColor,
                FontFamily,
                FontSize,
                ImageBlock,
                ImageInsert,
                ImageInsertViaUrl,
                ImageToolbar,
                ImageUpload,
                Indent,
                IndentBlock,
                Italic,
                Link,
                MediaEmbed,
                Paragraph,
                PasteFromOffice,
                SelectAll,
                SimpleUploadAdapter,
                Strikethrough,
                Table,
                TableCaption,
                TableCellProperties,
                TableColumnResize,
                TableProperties,
                TableToolbar,
                Underline,
                Undo,
                Base64UploadAdapter,
              ],
              toolbar: {
                items: [
                  "undo",
                  "redo",
                  "|",
                  "fontSize",
                  "fontFamily",
                  "fontColor",
                  "fontBackgroundColor",
                  "|",
                  "bold",
                  "italic",
                  "underline",
                  "strikethrough",
                  "|",
                  "link",
                  ...(useUpload
                    ? [
                        "insertImage",
                        "mediaEmbed",
                        "videoUpload", // 커스텀 비디오 업로드 버튼
                      ]
                    : []),
                  "insertTable",
                  "|",
                  "alignment",
                  "|",
                  "outdent",
                  "indent",
                ],
                shouldNotGroupWhenFull: false,
              },
              fontFamily: {
                supportAllValues: true,
              },
              fontSize: {
                options: [10, 12, 14, "default", 18, 20, 22],
                supportAllValues: true,
              },
              image: {
                toolbar: ["imageTextAlternative"],
              },
              link: {
                addTargetToExternalLinks: true,
                defaultProtocol: "https://",
              },
              table: {
                contentToolbar: [
                  "tableColumn",
                  "tableRow",
                  "mergeTableCells",
                  "tableProperties",
                  "tableCellProperties",
                ],
              },
              translations: [translations],
              mediaEmbed: {
                previewsInData: true,
                providers: [
                  {
                    name: "cloudFrontProvider",
                    // Handle cloudfront URLs specifically
                    url: /^https:\/\/d10lwkmubu17fq\.cloudfront\.net\/.+$/,
                    html: (match) => {
                      const videoUrl = match[0];
                      return `
                        <figure class="media">
                          <div data-oembed-url="${videoUrl}">
                            <video controls width="100%" style="max-width: 100%; border-radius: 4px;">
                              <source src="${videoUrl}" type="video/mp4">
                              브라우저가 HTML5 비디오를 지원하지 않습니다.
                            </video>
                          </div>
                        </figure>
                      `;
                    },
                  },
                  {
                    // 실제 비디오 URL에 대한 처리
                    name: "videoProvider",
                    url: /^blob:.*$/, // More specific regex
                    html: (match: RegExpMatchArray) => {
                      const videoUrl = match[0];
                      return `
                        <video 
                          controls
                          width="100%"
                          style="max-width: 100%; border-radius: 4px;"
                        >
                          <source src="${videoUrl}" type="video/mp4">
                          브라우저가 HTML5 비디오를 지원하지 않습니다.
                        </video>
                      `;
                    },
                  },
                ],
              },
              htmlEmbed: {
                showPreviews: true,
                sanitizeHtml: (inputHtml) => ({
                  html: DOMPurify.sanitize(inputHtml),
                  hasChanged: true,
                }),
              },
              language: "ko",
              initialData: "<p></p>",
              ...(useUpload && { extraPlugins: [VideoUploadPlugin] }),
            }}
            onReady={(editor) => {
              Ckeditor.current = editor;
              if (first.current && field.value !== "") {
                editor.setData(field.value);
                first.current = false;
              }
            }}
            onChange={(_event, editor) => {
              if (onChange) {
                onChange(editor.getData());
              } else {
                field.onChange(editor.getData());
              }
            }}
          />
          {validate && (
            <ErrorMessage
              name={name}
              validate={validate}
              watchNames={watchNames}
              isErrorVislble={isErrorVislble}
            />
          )}
        </div>
      )}
    </WithRegister>
  );
};

export default Ckeditor5Input;
