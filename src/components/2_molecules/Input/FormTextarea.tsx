"use client";

import clsx from "clsx";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import { ErrorMessage } from "@/components/1_atoms/ErrorMessage";
import { convertId } from "@/helpers/common";
import useLoading from "@/helpers/customHook/useLoading";
import { useRef, type CSSProperties, type ReactNode, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Textarea as TextareaFure } from "@/components/ui/textarea";
import { forEach, isArray } from "@/helpers/basic";
import { FormBuilder } from "@/components/2_molecules/Input/FormInput";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";

const Textarea = ({
  name,
  className,
  placeholder,
  disabled,
  validate,
  style,
  id,
  readOnly,
  autoComplete,
  children,
  isErrorVislble = true,
  watchNames,
  inputClassName,
  onChange,
  initHeight = "40px",
  useFitHeight,
  ...props
}: {
  name: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  validate?: ValidateType;
  style?: CSSProperties;
  id?: string;
  readOnly?: boolean;
  autoComplete?: string;
  children?: ReactNode;
  isErrorVislble?: boolean;
  watchNames?: string[];
  inputClassName?: string;
  onChange?: (e: any) => void;
  initHeight?: string;
  useFitHeight?: boolean;
  "data-testid"?: string;
}) => {
  const { register, control, getValues } = useFormContext(); // retrieve all hook methods
  const { loading } = useLoading();
  const currentRef = useRef<HTMLDivElement>(null);
  const currentValue = useWatch({
    control,
    name,
  });

  const [textareaStyle, setTextareaStyle] = useState({ height: initHeight });

  useEffectFunctionHook({
    Function: () => {
      if (currentRef?.current?.children?.[0]?.scrollHeight) {
        setTextareaStyle(
          currentValue === "" || useFitHeight
            ? { height: initHeight }
            : {
                height: `${currentRef.current.children[0].scrollHeight}px`,
              }
        );
      }
    },
    Unmount: () => {
      setTextareaStyle({ height: initHeight });
    },
    dependency: [currentValue],
  });

  const validateFunction = (value: any) => {
    if (isArray(watchNames, ">", 0)) {
      const returnValues: { [key: string]: string | number } = {};
      forEach([name, ...watchNames], (nameItem) => {
        returnValues[nameItem] = getValues(nameItem);
      });
      return !validate!(returnValues);
    }
    return !validate!(value);
  };

  return (
    <>
      <div
        ref={currentRef}
        className={clsx(
          !!children && "flex justify-between items-center",
          "w-full",
          className
        )}
      >
        <TextareaFure
          {...register(name, {
            ...(validate && {
              validate: validateFunction,
            }),
            ...(onChange && { onChange }),
          })}
          key={name}
          placeholder={placeholder}
          disabled={disabled || loading}
          readOnly={readOnly}
          style={{ ...textareaStyle, ...style }}
          id={convertId(id ?? name)}
          autoComplete={autoComplete}
          className={clsx("w-full", inputClassName)}
          data-testid={props["data-testid"]}
        />
        {children}
      </div>
      <ErrorMessage
        name={name}
        validate={validate}
        watchNames={watchNames}
        isErrorVislble={isErrorVislble}
      />
    </>
  );
};

const FormTextarea = ({
  name,
  id,
  label,
  placeholder,
  validate,
  disabled,
  inputStyle,
  readOnly,
  formClassName,
  inputClassName,
  labelClassName,
  errorClassName,
  autoComplete,
  children,
  watchNames,
  onChange,
  initHeight,
  ...props
}: {
  name: string;
  id?: string;
  label?: ReactNode;
  placeholder?: string;
  validate?: ValidateType;
  disabled?: boolean;
  inputStyle?: CSSProperties;
  readOnly?: boolean;
  formClassName?: string;
  inputClassName?: string;
  autoComplete?: string;
  labelClassName?: string;
  errorClassName?: string;
  children?: ReactNode;
  watchNames?: string[];
  onChange?: (e: any) => void;
  initHeight?: string;
  "data-testid"?: string;
}) => (
  <FormBuilder
    formClassName={formClassName}
    labelClassName={labelClassName}
    errorClassName={errorClassName}
    id={id}
    label={label ? label : ""}
    name={name}
    validate={validate}
    watchNames={watchNames}
  >
    <Textarea
      id={id}
      name={name}
      disabled={disabled}
      style={inputStyle}
      placeholder={placeholder}
      validate={validate}
      readOnly={readOnly}
      inputClassName={inputClassName}
      autoComplete={autoComplete}
      isErrorVislble={false}
      onChange={onChange}
      initHeight={initHeight}
      useFitHeight={!!initHeight}
      data-testid={props["data-testid"]}
    >
      {children}
    </Textarea>
  </FormBuilder>
);

export { Textarea, FormTextarea };
