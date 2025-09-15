import {
  HydrationBoundary,
  dehydrate,
  QueryClient,
  type QueryKey,
} from "@tanstack/react-query";

export const getQueryClient = () => new QueryClient();

import { isDifference } from "@/helpers/basic";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

interface QueryProps<ResponseType = unknown> {
  queryKey: QueryKey;
  queryFn: () => Promise<ResponseType>;
}

export async function getDehydratedQuery<Q extends QueryProps>({
  queryKey,
  queryFn,
}: Q) {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({ queryKey, queryFn });

  const { queries } = dehydrate(queryClient);

  const [dehydratedQuery] = queries.filter(
    (query) => !isDifference(query.queryKey, queryKey)
  );

  return dehydratedQuery;
}

export const Hydrate = HydrationBoundary;

export async function getDehydratedQueries<Q extends QueryProps[]>(queries: Q) {
  const queryClient = getQueryClient();

  await Promise.all(
    queries.map(({ queryKey, queryFn }) =>
      queryClient.prefetchQuery({ queryKey, queryFn })
    )
  );

  return dehydrate(queryClient).queries;
}
