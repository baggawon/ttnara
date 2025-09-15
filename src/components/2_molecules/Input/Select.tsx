"use client";

import clsx from "clsx";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import { ErrorMessage } from "@/components/1_atoms/ErrorMessage";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { map } from "@/helpers/basic";
import { convertId } from "@/helpers/common";
import WithRegister from "@/components/2_molecules/WithRegister";
import { cn } from "@/components/lib/utils";
import { v4 as uuidv4 } from "uuid";

export default function SelectInput({
  placeholder = "값을 선택해주세요",
  name,
  validate,
  onChange,
  buttonClassName,
  contentClassName,
  buttonWrapClassName,
  disabled,
  items,
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
  buttonWrapClassName?: string;
  disabled?: boolean;
  items: { value: any; label: any }[];
  valueDecoration?: string;
  watchNames?: string[];
  isErrorVislble?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  readOnly?: boolean;
  "data-testid"?: string;
}) {
  const uuid = uuidv4();
  return (
    <WithRegister name={name} validate={validate} watchNames={watchNames}>
      {(field) => (
        <Select
          value={field.value}
          onValueChange={(incomeValue) => {
            const convertType =
              typeof items[0]?.value === "number"
                ? Number(incomeValue)
                : incomeValue;
            if (onChange) {
              onChange(convertType);
            } else {
              field.onChange(convertType);
            }
          }}
          {...(open !== undefined && { open })}
          onOpenChange={(open) => {
            onOpenChange?.(open);
            field.onBlur({ target: { id: name }, type: "onBlur" });
          }}
          disabled={disabled}
        >
          <div className={cn("grid gap-2", buttonWrapClassName)}>
            <SelectTrigger
              ref={field.ref}
              name={field.name}
              id={convertId(field.name)}
              className={clsx(
                !buttonClassName && "!w-20",
                buttonClassName,
                readOnly && "pointer-events-none",
                "whitespace-nowrap"
              )}
              data-testid={props["data-testid"]}
            >
              <SelectValue placeholder={placeholder} />
              {valueDecoration && (
                <span className="mx-[6px]">{valueDecoration}</span>
              )}
            </SelectTrigger>
            {validate && (
              <ErrorMessage
                name={name}
                validate={validate}
                watchNames={watchNames}
                isErrorVislble={isErrorVislble}
              />
            )}
          </div>
          <SelectContent className={(clsx(contentClassName), "max-h-[300px]")}>
            {map(items, ({ value, label }, index) => (
              <SelectItem
                key={`${uuid}*&*${value}`}
                value={value}
                {...(props["data-testid"] && {
                  "data-testid": `${props["data-testid"]}-option-${index}`,
                })}
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </WithRegister>
  );
}
