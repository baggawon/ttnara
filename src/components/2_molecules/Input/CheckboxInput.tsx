"use client";

import clsx from "clsx";
import { ErrorMessage } from "@/components/1_atoms/ErrorMessage";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { convertId } from "@/helpers/common";
import useLoading from "@/helpers/customHook/useLoading";
import type { ChangeEvent, ReactNode } from "react";
import WithRegister from "@/components/2_molecules/WithRegister";

export const CheckboxInput = ({
  id,
  name,
  onClick,
  checkboxClassName,
  labelClassName,
  checked,
  disabled,
  loading,
  label,
  field,
  useOriginalId,
  ...props
}: {
  id?: string;
  name?: string;
  onClick?: (event: any) => void;
  checkboxClassName?: string;
  labelClassName?: string;
  checked?: boolean;
  disabled?: boolean;
  loading?: boolean;
  label?: ReactNode;
  field?: any;
  useOriginalId?: boolean;
  "data-testid"?: string;
}) => (
  <div className="items-center flex justify-start">
    <Checkbox
      className={clsx(checkboxClassName, disabled && " text-gray-400")}
      ref={field?.ref}
      onClick={(event: any) => {
        if (onClick) {
          onClick(event);
        } else {
          field?.onChange({
            ...event,
            target: { id: name, value: !(checked ?? field.value) },
          });
        }
      }}
      onBlur={field?.onBlur}
      id={`${!useOriginalId ? convertId(id ?? name) : (id ?? name)}${
        disabled ? "2" : ""
      }`}
      {...(onClick || field?.onChange
        ? {
            checked,
          }
        : {
            defaultChecked: checked,
          })}
      data-testid={props["data-testid"]}
    />

    <Label
      htmlFor={!useOriginalId ? convertId(id ?? name) : (id ?? name)}
      className={clsx(
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-2",
        disabled && " text-gray-400",
        labelClassName
      )}
    >
      {label}
    </Label>
  </div>
);

export const CustomCheckbox = ({
  name,
  disabled,
  label,
  validate,
  checkboxClassName,
  labelClassName,
  onClick,
  checked,
  id,
  isErrorVislble = true,
  watchNames,
  ...props
}: {
  name: string;
  disabled?: boolean;
  label?: ReactNode;
  validate?: ValidateType;
  checkboxClassName?: string;
  labelClassName?: string;
  onClick?: (event: ChangeEvent<HTMLInputElement>) => void;
  checked?: (value: string) => boolean;
  id?: string;
  isErrorVislble?: boolean;
  watchNames?: string[];
  "data-testid"?: string;
}) => {
  const { loading } = useLoading();
  return (
    <>
      <WithRegister
        name={name}
        validate={validate}
        watchNames={watchNames}
        valueCondition={checked}
      >
        {(field) => (
          <CheckboxInput
            id={id}
            name={name}
            onClick={onClick}
            checkboxClassName={checkboxClassName}
            labelClassName={labelClassName}
            checked={field.value}
            disabled={disabled}
            loading={loading}
            label={label}
            field={field}
            data-testid={props["data-testid"]}
          />
        )}
      </WithRegister>
      {validate && (
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
