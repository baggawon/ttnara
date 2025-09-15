import { useFormContext, useWatch } from "react-hook-form";

import { forEach, isArray, now } from "@/helpers/basic";
import { allowFileSize, convertFileSize, setTestId } from "@/helpers/common";
import React from "react";
import { FormBuilder } from "@/components/2_molecules/Input/FormInput";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import DashedCard from "@/components/1_atoms/DashedCard";
import clsx from "clsx";
import { Trash } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ToastData } from "@/helpers/toastData";
import {
  UPLOAD_FILE_LIMIT,
  UPLOAD_FILE_SIZE_MB,
  bettingId,
  uploadTypes,
} from "@/helpers/config";
import type { HelpFile } from "@/helpers/types";
import { useAdminModeStore } from "@/helpers/state";
import { EasyTooltip } from "@/components/1_atoms/EasyTooltip";

const FileUploader = ({
  name,
  disabled,
}: {
  name: string;
  disabled?: boolean;
}) => {
  const { setValue, getValues, control } = useFormContext(); // retrieve all hook methods
  const { toast } = useToast();
  const useAdmin = useAdminModeStore((state) => state.on);

  const files = useWatch({
    defaultValue: getValues(name),
    control,
    name,
  }) as (HelpFile & { file: File })[];

  const fileDelete = (uploadFileName: string) => {
    setValue(
      name,
      files.filter((item) => uploadFileName !== item.uploadFileName)
    );
  };

  const uploadHandler = (event: any) => {
    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
    const temp = [...files];
    let targetFiles;
    if (event?.target?.files) targetFiles = [...event.target.files];
    else {
      targetFiles = event.dataTransfer.items
        ? [...event.dataTransfer.items]
        : [...event.dataTransfer.files];
    }
    const totalCount = temp.length + targetFiles.length;

    const fileList: { uploadFileName: string; file: File }[] = [];
    if (totalCount <= UPLOAD_FILE_LIMIT) {
      forEach(targetFiles, (file) => {
        const targetFile: File =
          file.kind === "file" && typeof file.getAsFile === "function"
            ? file.getAsFile()
            : file;
        if (uploadTypes.includes(targetFile.type)) {
          if (allowFileSize(targetFile.size)) {
            fileList.push({
              uploadFileName: `${now().format("YYYY_MM_DD_HH_mm_ss")}_${
                getValues("id") > -1 ? getValues("id") : bettingId
              }_${files.length + fileList.length}.${
                targetFile.type.split("/")[1]
              }`,
              file: targetFile,
            });
          } else {
            toast({
              id: ToastData.attachedSizeLimit,
              type: "error",
            });
          }
        } else {
          toast({
            id: ToastData.attachedTypeLimit,
            type: "error",
          });
        }
      });
      if (fileList.length === targetFiles.length && isArray(fileList, ">", 0))
        setValue(name, [...files, ...fileList]);
    } else {
      toast({
        id: ToastData.attachedCountLimit,
        type: "error",
      });
    }
  };

  const dragOverHandler = (event: any) => event.preventDefault();

  return (
    <>
      <FormBuilder
        name={name}
        labelClassName="text-xl w-full [&>label]:w-full"
        label={
          <div className="w-full flex justify-between items-center">
            <Label className="text-lg font-bold">첨부파일</Label>
            {!useAdmin && (
              <Label
                className={clsx(
                  buttonVariants({ variant: "outline" }),
                  "cursor-pointer",
                  disabled && "opacity-50 pointer-events-none"
                )}
                htmlFor="fileUpload"
              >
                파일선택 +
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  onChange={uploadHandler}
                  multiple
                  accept={uploadTypes.join(", ")}
                  {...setTestId("fileUpload")}
                />
              </Label>
            )}
          </div>
        }
      >
        <DashedCard
          className={clsx(
            "min-h-[100px]",
            disabled && "opacity-50 pointer-events-none"
          )}
          onDrop={uploadHandler}
          onDragOver={dragOverHandler}
        >
          {isArray(files, "===", 0) && (
            <p className="absolute z-[0] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-black/30">
              여기에 업로드할 파일을 올려주세요.
            </p>
          )}
          {files &&
            isArray(files, ">", 0) &&
            files.map(({ uploadFileName, file, name, size }) => (
              <div
                className={clsx(
                  "flex justify-start items-center my-1 z-1",
                  useAdmin && "cursor-pointer"
                )}
                key={`${uploadFileName}`}
                {...(useAdmin && {
                  onClick: () => window.open(uploadFileName, "_blank"),
                })}
              >
                {file?.name ?? name}
                <b className="ml-4">{convertFileSize(file?.size ?? size)}</b>
                {!useAdmin && !disabled && (
                  <EasyTooltip
                    button={
                      <Button
                        type="button"
                        variant="ghost"
                        className="ml-2"
                        onClick={() => fileDelete(uploadFileName)}
                      >
                        <Trash
                          width={20}
                          height={20}
                          className="cursor-pointer"
                        />
                      </Button>
                    }
                  >
                    삭제
                  </EasyTooltip>
                )}
              </div>
            ))}
        </DashedCard>
        <Label className="text-black/30">
          파일당 최대 {UPLOAD_FILE_SIZE_MB}MB까지 업로드 가능합니다.
        </Label>
      </FormBuilder>
    </>
  );
};

export default FileUploader;
