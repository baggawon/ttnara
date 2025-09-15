"use client";

import { Calendar as CalendarIcon } from "../../../../node_modules/lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import clsx from "clsx";
import dayjs from "dayjs";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import WithRegister from "@/components/2_molecules/WithRegister";
import type { Matcher } from "react-day-picker";
import { ko } from "date-fns/locale";

export function DatePicker({
  name,
  placeholder = "날짜를 선택해 주세요.",
  validate,
  onChange,
  className,
  watchNames,
  mode = "single",
  disabled,
  fromYear,
  toYear,
}: {
  name: string;
  placeholder?: string;
  validate?: ValidateType;
  onChange?: (value: any) => void;
  className?: string;
  watchNames?: string[];
  mode?: "single" | "multiple" | "range" | "default";
  disabled?: Matcher | Matcher[] | undefined;
  fromYear?: Date;
  toYear?: Date;
}) {
  return (
    <WithRegister name={name} validate={validate} watchNames={watchNames}>
      {(field) => {
        let child = <span>{placeholder}</span>;
        if (mode === "single" && field.value) {
          child = <>{dayjs(field.value).format("YYYY-MM-DD")}</>;
        } else if (mode === "range" && field.value?.from) {
          if (field.value.to) {
            child = (
              <>
                {dayjs(field.value.from).format("YYYY-MM-DD")} ~{" "}
                {dayjs(field.value.to).format("YYYY-MM-DD")}
              </>
            );
          } else {
            child = <>{dayjs(field.value.from).format("YYYY-MM-DD")}</>;
          }
        }
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant={"outline"}
                aria-controls={`datePicker*&*${name}`}
                className={clsx(
                  "w-full justify-start text-left font-normal",
                  !field.value && "text-muted-foreground",
                  className
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {child}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode={mode}
                selected={field.value}
                onSelect={(newValue: any) => {
                  if (onChange) {
                    onChange(newValue);
                  }
                  field.onChange(newValue);
                }}
                initialFocus
                disabled={disabled}
                {...(mode === "range" && { numberOfMonths: 2 })}
                {...(fromYear && { captionLayout: "dropdown-buttons" })}
                fromYear={fromYear?.getFullYear()}
                toYear={toYear?.getFullYear()}
                fromDate={fromYear}
                toDate={toYear}
                {...(fromYear && {
                  classNames: {
                    caption:
                      "flex [&>div:first-child]:flex [&>div:first-child]:flex-col-reverse [&>div:first-child]:items-center justify-center pt-1 relative items-center [&>div>div>div:last-child]:hidden",
                  },
                })}
                locale={ko}
              />
            </PopoverContent>
          </Popover>
        );
      }}
    </WithRegister>
  );
}
