"use client";

import type { QueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";

import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Pass { silent: true } to keep the global loading overlay out of this query's
// status transitions. Used while we migrate away from the counter-overlay
// pattern toward local pending state / Suspense.
export interface UseGetQueryOptions {
  silent?: boolean;
}

const useGetQuery = <T, B>(
  queryIncludeOption: UseQueryOptions<T, any, T, any>,
  queryFunction: (
    router: AppRouterInstance,
    queryClient: QueryClient,
    queryData?: B
  ) => Promise<T>,
  queryData?: B,
  options?: UseGetQueryOptions
): { data: T | null; status: string } => {
  const router = useRouter();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();
  const queryResponse = useQuery<T, any>({
    ...queryIncludeOption,
    queryFn: () => queryFunction(router, queryClient, queryData),
  });

  if (queryResponse.error && !queryResponse.isFetching) {
    throw queryResponse.error;
  }

  const first = useRef(false);
  useEffectFunctionHook({
    Function: () => {
      if (
        queryResponse?.error &&
        queryResponse.status === "error" &&
        first.current
      ) {
        console.log(queryResponse?.error);
      }
      first.current = true;
    },
    Unmount: () => {
      if (first.current) first.current = false;
    },
    dependency: [queryResponse?.error, queryResponse?.status],
  });

  const silent = options?.silent === true;
  const prevStatus = useRef("");
  useEffectFunctionHook({
    Function: () => {
      if (silent) return;
      if (
        queryResponse?.status &&
        (queryIncludeOption?.enabled === true ||
          queryIncludeOption?.enabled === undefined)
      ) {
        const targetAction = queryResponse.isPending
          ? setLoading
          : disableLoading;
        if (prevStatus.current !== queryResponse.status) {
          targetAction();
        }
        prevStatus.current = queryResponse.status;
      }
    },
    dependency: [queryResponse?.status, queryResponse.isPending],
  });

  return {
    data: (queryResponse?.data as T) ?? null,
    status: queryResponse.status,
  };
};

export default useGetQuery;
