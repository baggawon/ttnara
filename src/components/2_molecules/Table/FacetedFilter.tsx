"use client";

import * as React from "react";
import type { Column } from "@tanstack/react-table";
import { Check, PlusCircle } from "../../../../node_modules/lucide-react";
import type { LucideIcon } from "../../../../node_modules/lucide-react";

import { cn } from "@/components/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { forEach, isArray } from "@/helpers/basic";
import clsx from "clsx";

interface DataTableFacetedFilter<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    [key: string]: {
      label: string;
      icon?: LucideIcon;
      sameFilters?: any[];
      iconClassName?: string;
    };
  };
}

const getValueFromOption = (value: string, option?: any) =>
  [
    value,
    ...(isArray<string>(option?.sameFilters) ? option.sameFilters : []),
  ].join("*&*");

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  data,
}: DataTableFacetedFilter<TData, TValue> & { data: TData[] }) {
  const facets = {
    get: (value: any) => {
      const convertValue = value.split("*&*")[0];
      let totalCount = 0;
      const hasSameFilters = isArray(
        options[convertValue]?.sameFilters,
        ">",
        0
      );
      data.forEach((row) => {
        const rowValue = (row as any)[column!.id!];
        if (rowValue === convertValue) totalCount++;
        if (hasSameFilters) {
          forEach(options[convertValue].sameFilters!, (sameFilter) => {
            if (rowValue === sameFilter) totalCount++;
          });
        }
      });

      return totalCount ? totalCount : undefined;
    },
  };
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-controls={`faceted-filter*&*${title}`}
          className="!h-10 border-dashed whitespace-nowrap"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  Object.entries(options)
                    .filter(([value, option]) =>
                      selectedValues.has(getValueFromOption(value, option))
                    )
                    .map(([value, option]) => (
                      <Badge
                        variant="secondary"
                        key={value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="검색어 입력" />
          <CommandList>
            <CommandEmpty>일치하는 결과가 없습니다.</CommandEmpty>
            <CommandGroup>
              {Object.entries(options).map(([value, option]) => {
                const currentValue = getValueFromOption(value, option);
                const isSelected = selectedValues.has(currentValue);
                return (
                  <CommandItem
                    key={value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(currentValue);
                      } else selectedValues.add(currentValue);

                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      );
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon
                        className={clsx(
                          "mr-2 h-4 w-4 text-muted-foreground",
                          option?.iconClassName
                        )}
                      />
                    )}
                    <span>{option.label}</span>
                    {facets.get(value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    필터 제거
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
