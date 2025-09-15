"use client";

import clsx from "clsx";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import { convertId } from "@/helpers/common";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "../../../../node_modules/lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import WithRegister from "@/components/2_molecules/WithRegister";
import type { Matcher } from "react-day-picker";

export default function CalendarInput({
  placeholder = "날짜 선택",
  name,
  validate,
  onChange,
  buttonClassName,
  contentClassName,
  disabledDays,
  watchNames,
}: {
  placeholder?: string;
  name: string;
  validate?: ValidateType;
  onChange?: (value: any) => void;
  buttonClassName?: string;
  contentClassName?: string;
  disabledDays?: Matcher[];
  watchNames?: string[];
}) {
  return (
    <WithRegister name={name} validate={validate} watchNames={watchNames}>
      {(field) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={"outline"}
              className={clsx(
                "w-full lg:w-60 justify-start text-left font-normal",
                buttonClassName,
                !field.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {field.value ? (
                format(field.value, "PPP", { locale: ko })
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={(value) => {
                if (onChange) onChange(value);
                else field.onChange(value);
              }}
              id={convertId(name)}
              locale={ko}
              initialFocus
              disabled={disabledDays}
              className={clsx(contentClassName)}
              {...(validate && { required: true })}
            />
          </PopoverContent>
        </Popover>
      )}
    </WithRegister>
  );
}
