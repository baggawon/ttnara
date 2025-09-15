"use client";

import { Check, ChevronsUpDown } from "../../../../node_modules/lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import clsx from "clsx";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import WithRegister from "@/components/2_molecules/WithRegister";

export default function Combobox({
  items,
  placeholder = "값을 선택해주세요",
  empty = "선택값이 없습니다.",
  name,
  validate,
  onChange,
  buttonClassName,
  contentClassName,
  disabled,
  watchNames,
}: {
  items: any[];
  placeholder?: string;
  empty?: string;
  name: string;
  validate?: ValidateType;
  onChange?: (value: any) => void;
  buttonClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  watchNames?: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <WithRegister name={name} validate={validate} watchNames={watchNames}>
      {(field) => (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-controls={`combobox*&*${name}`}
              className={clsx(
                "w-[200px] justify-between relative",
                buttonClassName
              )}
              disabled={disabled}
            >
              {field.value &&
                items.find((item) => item.value === field.value)?.label}
              {!field.value && !disabled ? placeholder : <div />}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={clsx(contentClassName, "w-[200px] p-0")}>
            <Command
              className="[&>div>div]:relative 
            [&>div>div>div:first-child]:sticky [&>div>div>div:first-child]:top-0 [&>div>div>div:first-child]:bg-popover [&>div>div>div:first-child]:z-[10000]
            "
            >
              <CommandList className="relaitve">
                <CommandInput placeholder="검색해주세요" />
                <CommandEmpty>{empty}</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.label}
                      onSelect={(currentValue) => {
                        const nextValue =
                          currentValue === field.value ? "" : currentValue;
                        const convertNewValue = items.find(
                          (item) => item.label?.toLowerCase() === nextValue
                        )?.value;
                        field.onChange(convertNewValue);
                        if (onChange) {
                          onChange(convertNewValue);
                        }
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={clsx(
                          "mr-2 h-4 w-4",
                          field.value === item.label
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </WithRegister>
  );
}
