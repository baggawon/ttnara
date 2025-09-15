"use client";

import clsx from "clsx";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import { ErrorMessage } from "@/components/1_atoms/ErrorMessage";
import { convertId } from "@/helpers/common";
import useLoading from "@/helpers/customHook/useLoading";
import type { CSSProperties, ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Input as InputFure } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forEach, isArray } from "@/helpers/basic";
import WithRegister from "@/components/2_molecules/WithRegister";

export enum InputType {
  text = "text",
  password = "password",
  number = "number",
  email = "email",
  tel = "tel",
}

const Input = ({
  name,
  className,
  placeholder,
  disabled,
  validate,
  type,
  style,
  id,
  readOnly,
  required,
  minLength,
  maxLength,
  defaultValue,
  autoComplete,
  children,
  beforeChildren,
  isErrorVislble = true,
  watchNames,
  inputClassName,
  min,
  max,
  step,
  onChange,
  isInnerMessage,
  isOuterChildren,
  onKeyDown,
  ...props
}: {
  name: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  validate?: ValidateType;
  type?: InputType;
  style?: CSSProperties;
  id?: string;
  readOnly?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  defaultValue?: any;
  autoComplete?: string;
  children?: ReactNode;
  beforeChildren?: ReactNode;
  isErrorVislble?: boolean;
  watchNames?: string[];
  inputClassName?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (e: any) => void;
  isInnerMessage?: boolean;
  isOuterChildren?: boolean;
  "data-testid"?: string;
  inputMode?: "numeric";

  onKeyDown?: (e: any) => void;
}) => {
  const { register, getValues } = useFormContext(); // retrieve all hook methods
  const { loading } = useLoading();

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
        className={clsx(
          !!children && "flex justify-between items-center",
          "w-full",
          className
        )}
      >
        {beforeChildren && beforeChildren}
        <InputFure
          {...register(name, {
            ...(validate && {
              validate: validateFunction,
            }),
            ...(onChange && { onChange }),
            valueAsNumber: type === InputType.number,
          })}
          key={name}
          placeholder={placeholder}
          disabled={disabled || loading}
          readOnly={readOnly}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          defaultValue={defaultValue}
          type={type ?? InputType.text}
          style={style}
          id={convertId(id ?? name)}
          autoComplete={autoComplete}
          className={clsx("w-full", inputClassName)}
          min={min}
          max={max}
          step={step}
          data-testid={props["data-testid"]}
          inputMode={props.inputMode}
          onKeyDown={onKeyDown}
        />
        {!isOuterChildren && children}
        {isInnerMessage && (
          <ErrorMessage
            name={name}
            validate={validate}
            watchNames={watchNames}
            isErrorVislble={isErrorVislble}
          />
        )}
      </div>
      {!isInnerMessage && (
        <ErrorMessage
          name={name}
          validate={validate}
          watchNames={watchNames}
          isErrorVislble={isErrorVislble}
        />
      )}
      {isOuterChildren && children}
    </>
  );
};

const FormInput = ({
  name,
  id,
  label,
  placeholder,
  validate,
  type,
  disabled,
  inputStyle,
  readOnly,
  required = false,
  minLength,
  maxLength,
  defaultValue,
  min,
  max,
  step = 1,
  formClassName,
  inputClassName,
  labelClassName,
  errorClassName,
  autoComplete,
  children,
  beforeChildren,
  watchNames,
  onChange,
  isOuterChildren,
  isErrorVislble = false,
  isInnerMessage = true,
  ...props
}: {
  name: string;
  id?: string;
  label?: ReactNode;
  placeholder?: string;
  validate?: ValidateType;
  type?: InputType;
  disabled?: boolean;
  inputStyle?: CSSProperties;
  readOnly?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  formClassName?: string;
  inputClassName?: string;
  autoComplete?: string;
  labelClassName?: string;
  errorClassName?: string;
  children?: ReactNode;
  watchNames?: string[];
  onChange?: (e: any) => void;
  isOuterChildren?: boolean;
  isErrorVislble?: boolean;
  "data-testid"?: string;
  beforeChildren?: ReactNode;
  isInnerMessage?: boolean;
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
    isErrorVislble={!isErrorVislble}
    disabled={disabled}
  >
    <Input
      id={id}
      name={name}
      disabled={disabled}
      style={inputStyle}
      type={type}
      placeholder={placeholder}
      validate={validate}
      readOnly={readOnly}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
      defaultValue={defaultValue}
      min={min}
      max={max}
      step={step}
      className={inputClassName}
      autoComplete={autoComplete}
      isErrorVislble={isErrorVislble}
      onChange={onChange}
      isOuterChildren={isOuterChildren}
      isInnerMessage={isInnerMessage}
      data-testid={props["data-testid"]}
      beforeChildren={beforeChildren}
    >
      {children}
    </Input>
  </FormBuilder>
);

const FormBuilder = ({
  name,
  id,
  label,
  formClassName,
  children,
  validate,
  labelClassName,
  errorClassName,
  isErrorVislble = true,
  watchNames,
  useFit = false,
  disabled,
}: {
  name: string;
  id?: string;
  label?: ReactNode;
  formClassName?: string;
  children: ReactNode;
  validate?: ValidateType;
  labelClassName?: string;
  errorClassName?: string;
  isErrorVislble?: boolean;
  watchNames?: string[];
  useFit?: boolean;
  disabled?: boolean;
}) => (
  <div className={clsx("relative", useFit ? "w-fit" : "w-full")}>
    <div className={clsx("grid gap-4", formClassName)}>
      {label && label !== "" && (
        <div
          className={clsx(
            "flex items-center space-x-1 whitespace-nowrap",
            labelClassName,
            disabled && "opacity-50"
          )}
        >
          {/* {validate && <Required />} */}
          <Label htmlFor={convertId(id ?? name)}>{label}</Label>
        </div>
      )}
      {children}
    </div>
    <div className={clsx(errorClassName)}>
      <ErrorMessage
        name={name}
        validate={validate}
        watchNames={watchNames}
        isErrorVislble={isErrorVislble}
      />
    </div>
  </div>
);

const ControllInput = ({
  name,
  className,
  placeholder,
  disabled,
  validate,
  type,
  style,
  id,
  readOnly,
  autoComplete,
  children,
  isErrorVislble = true,
  watchNames,
  inputClassName,
  min,
  max,
  step,
  onChange,
  isInnerMessage,
  ...props
}: {
  name: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  validate?: ValidateType;
  type?: InputType;
  style?: CSSProperties;
  id?: string;
  readOnly?: boolean;
  autoComplete?: string;
  children?: ReactNode;
  isErrorVislble?: boolean;
  watchNames?: string[];
  inputClassName?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (e: any) => void;
  isInnerMessage?: boolean;
  "data-testid"?: string;
}) => {
  const { loading } = useLoading();
  return (
    <>
      <WithRegister name={name} validate={validate} watchNames={watchNames}>
        {(field) => (
          <div
            className={clsx(
              !!children && "flex justify-between items-center",
              "w-full",
              className
            )}
          >
            <InputFure
              ref={field.ref}
              name={field.name}
              onChange={(value) => {
                if (onChange) {
                  onChange(value);
                } else {
                  field.onChange(value);
                }
              }}
              value={field.value}
              onBlur={field.onBlur}
              key={name}
              placeholder={placeholder}
              disabled={disabled || loading}
              readOnly={readOnly}
              type={type ?? InputType.text}
              style={style}
              id={convertId(id ?? name)}
              autoComplete={autoComplete}
              className={clsx("w-full", inputClassName)}
              min={min}
              max={max}
              step={step}
              data-testid={props["data-testid"]}
            />
            {children}
            {isInnerMessage && (
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
      {!isInnerMessage && (
        <ErrorMessage
          name={name}
          validate={validate}
          watchNames={watchNames}
          isErrorVislble={isErrorVislble}
        />
      )}
    </>
  );
};

export { Input, FormInput, FormBuilder, ControllInput };
