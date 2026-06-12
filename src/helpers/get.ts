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

export const pointHistoryGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.pointHistory, { query });

  if (hasData) return hasData;

  return null;
};

export const boardActivityGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.boardActivity, { query });

  if (hasData) return hasData;

  return null;
};

export const rankSummaryGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.rankSummary, { query });

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

export const adminAmadoEventsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminAmadoEventsRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminEmailTemplatesGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminEmailTemplatesRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminFeaturedPostGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: { id: number }
) => {
  const { hasData } = await get(ApiRoute.adminFeaturedPostRead, { query });

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

export const adminTetherSettingsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminTetherSettingsRead, { query });

  if (hasData) return hasData;

  return null;
};

export const tetherSettingsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.tetherSettingsRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminNavListGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminNavList, { query });
  if (hasData) return hasData;
  return null;
};

export const navListGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: { surface?: string }
) => {
  const { hasData } = await get(ApiRoute.navList, { query });
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

export const adminRankBadgesGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminRankBadgesList, { query });

  if (hasData) return hasData;

  return null;
};

export const adminBoardRanksGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminBoardRanksRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const attendanceGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.attendanceRead, { query });

  if (hasData) return hasData;

  return null;
};

export const profileSummaryGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.profileSummary, { query });

  if (hasData) return hasData;

  return null;
};

export const adminAttendanceStreaksGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminAttendanceStreaksRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminAttendanceSettingGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminAttendanceSettingRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminBoardRankBadgesGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminBoardRankBadgesList, { query });

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

export const attachedMediaGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.uploadsMediaList, { query });

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

export const adminGuaranteeGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminGuaranteeRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminSupportLinkCardsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminSupportLinkCardsRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminSupportQnaCategoriesGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminSupportQnaCategoriesRead, {
    query,
  });

  if (hasData) return hasData;

  return null;
};

export const adminSupportQnaGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminSupportQnaRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminGuaranteeRegionsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminGuaranteeRegionsRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminGuaranteeBannerGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminGuaranteeBannerRead, { query });

  if (hasData) return hasData;

  return null;
};

export const publicGuaranteeGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.guaranteeRead);

  if (hasData) return hasData;

  return null;
};

export const adminPopupsGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminPopupRead, { query });

  if (hasData) return hasData;

  return null;
};

export const adminPushTemplatesGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminPushTemplateRead, { query });
  if (hasData) return hasData;
  return null;
};

export const adminPushHistoryGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminPushHistoryRead, { query });
  if (hasData) return hasData;
  return null;
};

export const popupListGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.popupList, { query });

  if (hasData) return hasData;

  return null;
};

export const leaderboardGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.leaderboardRead, { query });

  if (hasData) return hasData;

  return null;
};

export const leaderboardUserGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.leaderboardUserRead, { query });

  if (hasData) return hasData;

  return null;
};

export const boardPreviewGet = async (
  router: AppRouterInstance,
  queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.boardPreviewRead, { query });

  if (hasData) return hasData;

  return null;
};

export const chatPublicConfigGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.chatTopicsRead);
  return hasData ?? null;
};

export const adminChatSettingsGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.adminChatSettingsRead);
  return hasData ?? null;
};

export const adminChatTopicsGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.adminChatTopicsRead);
  return hasData ?? null;
};

export const adminChatNoticesGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.adminChatNoticesRead);
  return hasData ?? null;
};

export const adminChatBannedWordsGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.adminChatBannedWordsRead);
  return hasData ?? null;
};

export const adminChatFixedMessagesGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.adminChatFixedMessagesRead);
  return hasData ?? null;
};

export const adminChatMutedUsersGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.adminChatMutedUsers);
  return hasData ?? null;
};

export const adminChatSpamUsersGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.adminChatSpamUsers);
  return hasData ?? null;
};

export const adminChatBannedUsersGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.adminChatBannedUsers);
  return hasData ?? null;
};

export const adminChatHiddenMessagesGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminChatHiddenMessages, { query });
  return hasData ?? null;
};

export const adminChatReportsGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminChatReports, { query });
  return hasData ?? null;
};

export const adminChatHistoryGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient,
  query?: any
) => {
  const { hasData } = await get(ApiRoute.adminChatHistoryRead, { query });
  return hasData ?? null;
};

export const adminChatTopicStatsGet = async (
  _router: AppRouterInstance,
  _queryClient: QueryClient
) => {
  const { hasData } = await get(ApiRoute.adminChatTopicStats);
  return hasData ?? null;
};
