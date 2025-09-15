import { Prisma, type profile, type user, type kyc } from "@prisma/client";
import { forEach } from "@/helpers/basic";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface UserForAdmin extends user {
  profile: profile | null;
  kyc: kyc[];
}

export interface UsersListResponse {
  users: UserForAdmin[];
  pagination: PaginationInfo;
}

export interface UsersReadProps {
  page: number;
  pageSize: number;
  is_active?: boolean;
  is_admin?: boolean;
  order?: "asc" | "desc";
  user_level?: number;
  auth_level?: number;
  search?: string;
}

async function getUsersWithPagination(
  queryParams: any
): Promise<UsersListResponse> {
  // 정렬 순서
  let created_at: Prisma.SortOrder = Prisma.SortOrder.desc;
  if (queryParams?.order === "asc") created_at = Prisma.SortOrder.asc;
  const where: Prisma.userWhereInput = {};

  if (typeof queryParams.is_active === "boolean")
    where.is_active = queryParams.is_active;

  if (queryParams.is_admin === true) {
    if (!where.OR) where.OR = [];
    where.OR.push({ is_superuser: true });
    where.OR.push({ profile: { is_app_admin: true } });
  }
  if (queryParams.is_admin === false) {
    if (!where.OR) where.OR = [];
    where.OR.push({ is_superuser: false });
    where.OR.push({ profile: { is_app_admin: false } });
  }

  if (typeof queryParams.user_level === "number")
    where.profile = { user_level: queryParams.user_level };

  if (typeof queryParams.auth_level === "number")
    where.profile = { auth_level: queryParams.auth_level };

  if (queryParams.search) {
    if (!where.OR) {
      where.OR = [];
      where.OR.push({ username: { startsWith: queryParams.search } });
      where.OR.push({
        profile: { displayname: { startsWith: queryParams.search } },
      });
    } else {
      forEach(where.OR, (value, index) => {
        if (Object.keys(value).includes("is_superuser"))
          where.OR![index].username = { startsWith: queryParams.search };

        if (Object.keys(value).includes("profile"))
          where.OR![index].profile!.displayname = {
            startsWith: queryParams.search,
          };
      });
    }
  }

  const manager = paginationManager(queryParams);
  const { page, pageSize } = manager.getPageInfo();

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.user.count({
        where,
      }),
      prisma.user.findMany({
        where,
        orderBy: { created_at },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          profile: true,
          kyc: true,
        },
      }),
    ])
  );
  if (!result) throw ToastData.unknown;
  const totalCount = result[0];
  const users = result[1];
  if (!users || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  return {
    users,
    pagination: manager.getPagination(),
  };
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getUsersWithPagination(queryParams);
    return {
      result: true,
      data: response,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
}
