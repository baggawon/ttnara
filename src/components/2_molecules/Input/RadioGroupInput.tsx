"use client";

import { Label } from "@/components/ui/label";
import clsx from "clsx";
import { ErrorMessage } from "@/components/1_atoms/ErrorMessage";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import {
  RadioGroup as OriginRadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { buttonVariants } from "@/components/ui/button";
import type { ReactElement, ReactNode } from "react";
import WithRegister from "@/components/2_molecules/WithRegister";

export const RadioGroupInput = ({
  label,
  value,
  type = "radio",
  mainValue,
  className,
  preId,
}: {
  label: ReactNode;
  value: any;
  type?: "radio" | "button" | "tab";
  mainValue?: any;
  className?: string;
  preId?: string;
}) => {
  const convertValue = preId ? `${preId}*&*${value}` : value;
  return (
    <>
      {type === "radio" ? (
        <div className="flex items-center space-x-2 w-full">
          <RadioGroupItem
            value={value}
            id={convertValue}
            className={clsx(type !== "radio" && "hidden")}
          />
          <Label htmlFor={convertValue} className={clsx(className)}>
            <p>{label}</p>
          </Label>
        </div>
      ) : (
        <Label
          htmlFor={convertValue}
          className={clsx(className)}
          {...(type === "button" && {
            className: clsx(
              buttonVariants({ variant: "outline" }),
              "!ml-0 rounded-none w-full",
              mainValue === value && "!bg-primary !text-white !border-primary",
              className
            ),
          })}
        >
          <RadioGroupItem
            value={value}
            id={convertValue}
            className={clsx("hidden")}
          />
          <p>{label}</p>
        </Label>
      )}
    </>
  );
};

export const RadioGroup = ({
  name,
  children,
  className,
  validate,
  onChange,
  type,
  isErrorVislble = true,
  watchNames,
}: {
  name: string;
  children: (props: any) => ReactElement;
  className?: string;
  validate?: ValidateType;
  onChange?: (value: any) => void;
  type?: "button";
  isErrorVislble?: boolean;
  watchNames?: string[];
}) => (
  <WithRegister name={name} validate={validate} watchNames={watchNames}>
    {(field) => (
      <>
        <OriginRadioGroup
          onValueChange={(newValue: any) => {
            const convertNewValue = newValue.split("*&*")[0];
            if (onChange) {
              onChange(convertNewValue);
            } else {
              field.onChange(convertNewValue);
            }
          }}
          value={field.value}
          ref={field.ref}
          onBlur={field.onBlur}
          id={name}
          name={name}
          className={clsx(
            className,
            type === "button" &&
              "whitespace-nowrap !gap-0 [&>div:first-child>label]:rounded-tl-md [&>div:first-child>label]:rounded-bl-md [&>div:last-child>label]:rounded-tr-md [&>div:last-child>label]:rounded-br-md"
          )}
        >
          {children(field.value)}
        </OriginRadioGroup>
        <ErrorMessage
          name={name}
          validate={validate}
          watchNames={watchNames}
          isErrorVislble={isErrorVislble}
        />
      </>
    )}
  </WithRegister>
);
