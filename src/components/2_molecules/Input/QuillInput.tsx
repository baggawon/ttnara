"use client";

import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css"; // Add css for snow theme
import WithRegister from "@/components/2_molecules/WithRegister";
import {
  ErrorMessage,
  type ValidateType,
} from "@/components/1_atoms/ErrorMessage";
import { convertId } from "@/helpers/common";
import clsx from "clsx";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { useFormContext } from "react-hook-form";
import { useRef } from "react";

const QuillInput = ({
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
  "data-testid"?: string;
}) => {
  const { getValues, setValue } = useFormContext(); // retrieve all hook methods
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, false] }],
      ["bold", "italic", "underline", "strike"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link", "image"],
      [{ color: [] }, { background: [] }], // dropdown with defaults from theme
      [{ align: [] }],
    ],
  };
  const formats = [
    "bold",
    "italic",
    "underline",
    "strike",
    "align",
    "list",
    "indent",
    "size",
    "header",
    "link",
    "image",
    "video",
    "color",
    "background",
  ];
  const { quill, quillRef } = useQuill({ modules, formats });

  useEffectFunctionHook({
    Function: () => {
      if (quill) {
        quill.on("text-change", (_delta, _oldDelta, _source) => {
          if (onChange) {
            onChange(quillRef.current.firstChild.innerHTML);
          } else {
            setValue(name, quillRef.current.firstChild.innerHTML);
          }
        });
      }
    },
    dependency: [quill, getValues],
  });

  const first = useRef(true);

  return (
    <WithRegister name={name} validate={validate} watchNames={watchNames}>
      {(field) => {
        if (first.current && quill && field.value !== "") {
          quill.clipboard.dangerouslyPasteHTML(field.value);
          first.current = false;
        }
        return (
          <>
            <div
              ref={field.ref}
              id={convertId(field.name)}
              style={{ minHeight: "300px", marginBottom: "42px" }}
              className={clsx(
                "[&>div:nth-of-type(1)]:rounded-t-lg [&>div:nth-of-type(1)]:border-input",
                "[&>div:nth-of-type(2)]:bg-background [&>div:nth-of-type(2)]:rounded-b-lg [&>div:nth-of-type(2)]:border-input"
              )}
            >
              <div
                ref={quillRef}
                {...(props["data-testid"] && {
                  "data-testid": props["data-testid"],
                })}
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
          </>
        );
      }}
    </WithRegister>
  );
};

export default QuillInput;
