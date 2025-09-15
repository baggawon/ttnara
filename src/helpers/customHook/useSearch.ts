"use client";

import { useState, useRef } from "react";

import { searchValueFromObject, isDifference } from "@/helpers/common";
import { filterMap, isArray, removeColumnsFromObject } from "@/helpers/basic";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";

const useSearch = <T>({
  originalData,
  columns,
  excludeColumns,
}: {
  originalData: T[];
  columns?: CustomColumDef<T, any>[];
  excludeColumns?: string[];
}) => {
  const [searchItem, setSearchItem] = useState<T[]>([]);
  const [isSearch, setIsSearch] = useState(false);
  const searchInput = useRef("");
  const searchControllRef = useRef<HTMLInputElement>(null);
  const exceptColumn = excludeColumns
    ? [
        ...filterMap(
          columns ?? [],
          (column) => column?.option && column.accessorKey
        ),
        ...excludeColumns,
      ]
    : filterMap(
        columns ?? [],
        (column) => column?.option && column.accessorKey
      );

  const exceptedItem = (item: T) => removeColumnsFromObject(item, exceptColumn);

  const onSearchItem = (event: any) => {
    searchInput.current = event.target.value?.toLowerCase();
    if (event && (event?.target as any)?.value === "") {
      if (isSearch) setIsSearch(false);
      if (isArray(searchItem, ">", 0)) setSearchItem([]);
    } else {
      const searchValue = (event as any).target.value?.toLowerCase();
      if (!isSearch) setIsSearch(true);
      const searchResult = originalData.filter(
        (item) =>
          searchValueFromObject(columns ? exceptedItem(item) : item).indexOf(
            searchValue
          ) > -1
      );

      if (isDifference(searchResult, searchItem)) {
        setSearchItem(searchResult);
      }
    }
  };

  const resetInput = (value?: string) => {
    if (searchControllRef.current) {
      searchControllRef.current.value = value ?? "";
      onSearchItem({ target: searchControllRef.current });
    }
  };

  useEffectFunctionHook({
    Function: () => {
      if (isSearch && searchInput.current !== "") {
        const searchResult = originalData.filter(
          (item) =>
            searchValueFromObject(columns ? exceptedItem(item) : item).indexOf(
              searchInput.current
            ) > -1
        );

        if (isDifference(searchResult, searchItem)) {
          setSearchItem(searchResult);
        }
      }
    },
    dependency: [isSearch, searchInput.current, originalData, exceptedItem],
  });

  return {
    isSearch,
    searchItem,
    searchRegister: { searchControllRef, onSearchItem },
    resetInput,
  };
};

export default useSearch;
