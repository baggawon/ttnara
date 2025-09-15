import type { QueryClient } from "@tanstack/react-query";
import type { UsersReadProps } from "@/app/api/admin_di2u3k2j/users/read";
import { get } from "@/helpers/common";
import { ApiRoute } from "@/helpers/types";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const sessionGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const response = await fetch(ApiRoute.session);

  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const commonGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.commonData);

  if (hasData) return hasData;

  return null;
};

export const userSettingsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.signupRead);

  if (hasData) return hasData;

  return null;
};

export const userGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.settingsRead);

  if (hasData) return hasData;

  return null;
};

export const threadsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.threadsRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const summaryThreadsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.summaryThreadsRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const tethersGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.tethersRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const messageGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.messageRead, { query });

  if (hasData) return hasData;

  return null;
};

export const partnersGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.partnersRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const tetherKrwRateGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.tetherKrwRate, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const alarmGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.alarmRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const adminGeneralGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminGeneralRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminLevelGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminLevelRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminUserSettingGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminUserSettingRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminThreadGeneralSettingsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminThreadSettingsGeneralRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const adminUsersGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: UsersReadProps
) => {
  const { hasData } = await get(ApiRoute.adminUsersRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminTopicsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminTopicsRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const adminTopicCategoriesGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminTopicCategoriesRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const adminTetherCategoriesGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminTetherCategoriesRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const adminRanksGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminRanksRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const threadGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.threadRead, { query });

  if (hasData) return hasData;

  return null;
};

export const topicSettingsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.topicSettingsRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminUserGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminUserRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminPartnersGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminPartnersRead, { query });

  if (hasData) return hasData;

  return null;
};
