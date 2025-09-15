import { handleConnect } from "@/helpers/server/prisma";
import { AlarmTypes, AppRoute, UserSettings } from "@/helpers/types";

import { getServerSession, type Session } from "next-auth";
import {
  admins,
  isAbleLoginCondition,
  PAGINAGION_SIZE,
  version,
} from "@/helpers/config";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { ToastData } from "@/helpers/toastData";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import type { SiteSettings } from "@/app/api/initialize/data";
import { filterMap, map } from "@/helpers/basic";
import webpush from "@/helpers/server/webPush";
import type { profile, settings, user } from "@prisma/client";

export const isExistUserId = async (username: string) =>
  handleConnect((prisma) =>
    prisma.user.findUnique({
      select: {
        id: true,
        is_active: true,
        profile: {
          select: {
            phone_is_validated: true,
            auth_level: true,
          },
        },
      },
      where: { username },
    })
  );

export const getId = async (session: Session | null) => {
  if (!session?.user?.name) return undefined;
  const result = await handleConnect((prisma) =>
    prisma.user.findUnique({
      select: {
        id: true,
      },
      where: {
        username: session.user!.name!,
        ...isAbleLoginCondition(),
      },
    })
  );
  return result?.id;
};

export const getUser = async (session: Session | null) => {
  if (!session?.user?.name) return undefined;
  const result = await handleConnect((prisma) =>
    prisma.user.findUnique({
      where: {
        username: session.user!.name!,
      },
      include: {
        profile: {
          select: {
            phone_number: true,
            displayname: true,
            auth_level: true,
            phone_is_validated: true,
            kyc_id: true,
          },
        },
      },
    })
  );
  return result;
};

export const getAdminId = async (session: Session | null) => {
  if (!session?.user?.name) return undefined;
  const result = await handleConnect((prisma) =>
    prisma.user.findUnique({
      select: {
        id: true,
        is_superuser: true,
        profile: {
          select: {
            is_app_admin: true,
          },
        },
      },
      where: {
        username: session.user!.name!,
        ...isAbleLoginCondition(),
      },
    })
  );
  return result?.profile?.is_app_admin || result?.is_superuser
    ? result?.id
    : undefined;
};

export const getAdminData = async (session: Session | null) => {
  if (!session?.user?.name) return undefined;
  const result = await handleConnect((prisma) =>
    prisma.user.findUnique({
      where: {
        username: session.user!.name!,
        OR: [{ profile: { is_app_admin: true } }, { is_superuser: true }],
      },
      include: {
        profile: {
          select: {
            auth_level: true,
            phone_is_validated: true,
            kyc_id: true,
          },
        },
      },
    })
  );
  return !!result ? result : undefined;
};

export const convertFileToBuffer = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.alloc(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
};

export enum RequestValidator {
  User = "user",
  Admin = "admin",
}

export const requestValidator = async (
  types: RequestValidator[],
  input: any
) => {
  const generalSettings = appCache.getByKey(CacheKey.GeneralSettings) as
    | SiteSettings
    | undefined;
  const session = await getServerSession(authOptions);

  if (generalSettings) {
    if (!generalSettings.allow_login && session?.user?.auth !== admins[1])
      throw ToastData.noAuth;
  }
  if (
    (input?.version ??
      (typeof input.get === "function" && input?.get("version"))) !== version
  )
    throw ToastData.oldVersion;
  if (input?.version) delete input.version;
  const isPersonal =
    input?.useAdmin !== true ||
    (typeof input.get === "function" && input?.get("useAdmin") !== "true");
  if (input?.useAdmin) delete input.useAdmin;

  let uid: undefined | string;
  let adminUid: undefined | string;
  let kycId: null | string = null;
  const validate = async (data?: RequestValidator) => {
    if (data === RequestValidator.User) {
      const userData = await getUser(session);
      if (userData) {
        uid = userData.id;
        kycId = userData.profile?.kyc_id ?? null;
        const result = checkUserStatus(userData);
        if (result) throw result;

        const login_history = await handleConnect((prisma) =>
          prisma.login_history.findMany({
            where: {
              uid: userData.id,
            },
            orderBy: {
              created_at: "desc",
            },
            take: 1,
          })
        );
        if (!login_history) throw ToastData.unknown;
        if (login_history.length === 0) {
          await handleConnect((prisma) =>
            prisma.login_history.create({
              data: {
                uid: userData.id,
                ip: "unknown",
                agent: "unknown",
              },
            })
          );
        } else {
          await handleConnect((prisma) =>
            prisma.login_history.update({
              where: {
                id: login_history[0].id,
              },
              data: {
                created_at: new Date(),
              },
            })
          );
        }
      }

      if (!uid) throw ToastData.noAuth;
    }
    if (data === RequestValidator.Admin) {
      const userData = await getAdminData(session);
      if (userData) {
        adminUid = userData.id;
        uid = userData.id;
        kycId = userData.profile?.kyc_id ?? null;
        const result = checkUserStatus(userData);
        if (result) throw result;
      }
      if (!adminUid) throw ToastData.noAuth;
    }
  };
  await Promise.all([validate(types?.[0]), validate(types?.[1])]);
  return {
    uid,
    adminUid,
    session,
    isAdmin: async () => await getAdminId(session),
    isPersonal,
    kycId,
  };
};

export const checkUserStatus = (user: {
  is_active: boolean;
  profile: { auth_level: number; phone_is_validated: boolean } | null;
}) => {
  // if (!user?.profile?.phone_is_validated) return ToastData.waitConfirm;

  if (!user.is_active) return ToastData.inactive;
};

export const paginationManager = (queryParams: any) => {
  const page = queryParams.page ?? 1;
  let pageSize = 10;
  let paginationSize = PAGINAGION_SIZE;

  if (typeof queryParams.topic_url === "string") {
    const topics = appCache.getByKey(CacheKey.Topics) as any;

    if (topics[queryParams.topic_url]) {
      pageSize = topics[queryParams.topic_url].thread_page_size;
    }
    if (topics[queryParams.topic_url].thread_page_nav_size) {
      paginationSize = topics[queryParams.topic_url].thread_page_nav_size;
    }
  }

  let totalCount = 0;

  return {
    getPageInfo: () => {
      return {
        page,
        pageSize,
      };
    },
    setTotalCount: (count: number) => {
      totalCount = count;
    },
    getPagination: () => {
      const totalPages = Math.ceil(totalCount / pageSize);
      return {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        pageSize,
        hasNextPage: paginationSize + page <= totalPages,
        hasPreviousPage: paginationSize < page,
      };
    },
  };
};

export const webPushUserSelect = {
  id: true,
  push_token: true,
  profile: {
    select: {
      displayname: true,
    },
  },
  settings: {
    select: {
      key: true,
      value: true,
    },
  },
};

export interface WebPushPayload {
  title: string;
  body: string;
  url: string;
  uid: string;
  type: AlarmTypes;
  tokens: string[];
}

export const sendWebpush = async (
  payloads: WebPushPayload[],
  userDatas: (Pick<user, "id" | "push_token"> & {
    profile: Pick<profile, "displayname"> | null;
    settings: Pick<settings, "key" | "value">[];
  })[]
) => {
  const removeTokens: {
    uid: string;
    token: string;
  }[] = [];

  if (payloads.length > 0) {
    await Promise.all(
      map(payloads, async (payload) => {
        const { tokens, uid, ...payloadData } = payload;
        const userData = userDatas.find((user) => user.id === uid);
        const userSettings = getSettingType(payload);
        if (payloadData.type !== AlarmTypes.Message)
          await handleConnect((prisma) =>
            prisma.alarm.create({
              data: {
                user_id: uid,
                ...payloadData,
              },
            })
          );
        if (
          userData &&
          userSettings &&
          canSendWebPush(userData, userSettings)
        ) {
          await Promise.all(
            map(payload.tokens, async (token) => {
              try {
                const result = await webpush.sendNotification(
                  JSON.parse(token),
                  JSON.stringify(payloadData)
                );
                if (result.statusCode === 410)
                  removeTokens.push({ uid, token });
              } catch (e: any) {
                if (e.statusCode === 410) removeTokens.push({ uid, token });
              }
            })
          );
        }
      })
    );

    if (removeTokens.length > 0) {
      await handleConnect((prisma) =>
        Promise.all(
          map(removeTokens, (removeToken) =>
            prisma.user.update({
              where: {
                id: removeToken.uid,
              },
              data: {
                push_token: filterMap(
                  userDatas.find((user) => user.id === removeToken.uid)!
                    .push_token,
                  (token) => token !== removeToken.token
                ),
              },
            })
          )
        )
      );
    }
  }
};

const getSettingType = (payload: WebPushPayload) => {
  switch (payload.type) {
    case AlarmTypes.Message:
      return UserSettings.message_notification;
    case AlarmTypes.P2PComplete:
    case AlarmTypes.P2PProgress:
    case AlarmTypes.P2PCancel:
    case AlarmTypes.P2POwnerCancel:
    case AlarmTypes.P2PProposalCancel:
      return UserSettings.tether_notification;
  }
};

export const canSendWebPush = (
  user: Pick<user, "push_token"> & {
    settings: Pick<settings, "key" | "value">[];
  },
  settingType: UserSettings
) =>
  user.push_token.length > 0 &&
  user.settings?.some(
    (setting) => setting.key === settingType && setting.value === "true"
  );

const getPayloadTitle = (type: AlarmTypes) => {
  switch (type) {
    case AlarmTypes.Message:
      return "쪽지 도착";
    case AlarmTypes.P2PComplete:
      return "거래완료";
    case AlarmTypes.P2PProgress:
      return "거래요청";
    case AlarmTypes.P2POwnerCancel:
    case AlarmTypes.P2PCancel:
    case AlarmTypes.P2PProposalCancel:
      return "거래취소";
  }
};

const getPayloadUrl = (type: AlarmTypes, tether_id?: number) => {
  switch (type) {
    case AlarmTypes.Message:
      return `${process.env.NEXTAUTH_URL}/${AppRoute.MessageInbox}`;
    case AlarmTypes.P2PComplete:
    case AlarmTypes.P2PProgress:
    case AlarmTypes.P2POwnerCancel:
    case AlarmTypes.P2PCancel:
    case AlarmTypes.P2PProposalCancel:
      return `${process.env.NEXTAUTH_URL}/${AppRoute.Tether}/${tether_id}`;
  }
};

export const makeMessagePayload = ({
  body,
  type,
  user,
  tether_id,
}: {
  body: string;
  type: AlarmTypes;
  user: Pick<user, "id" | "push_token"> & {
    profile: Pick<profile, "displayname"> | null;
    settings: Pick<settings, "key" | "value">[];
  };
  tether_id?: number;
}) => {
  return {
    title: getPayloadTitle(type),
    body,
    url: getPayloadUrl(type, tether_id),
    uid: user.id,
    tokens: user.push_token,
    type,
  };
};
