import { Prisma, type profile, type user, type kyc } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";
import { signProfileImages } from "@/app/api/admin_di2u3k2j/user/read";

export interface UserForAdmin extends Omit<user, "password"> {
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
  // Each independent filter is its own OR-group ANDed together. Using a single
  // shared `where.OR` (the previous approach) made the admin filter and the
  // search clobber each other: a second `where.profile =` dropped the first,
  // and search mutated the is_admin OR clauses in place (ANDing the term into
  // them) instead of standing as its own constraint.
  const and: Prisma.userWhereInput[] = [];

  if (typeof queryParams.is_active === "boolean")
    where.is_active = queryParams.is_active;

  if (queryParams.is_admin === true) {
    and.push({
      OR: [{ is_superuser: true }, { profile: { is_app_admin: true } }],
    });
  }
  if (queryParams.is_admin === false) {
    and.push({
      OR: [{ is_superuser: false }, { profile: { is_app_admin: false } }],
    });
  }

  // Merge profile-level constraints into one relation filter instead of
  // overwriting, so user_level and auth_level can both apply.
  const profileFilter: Prisma.profileWhereInput = {};
  if (typeof queryParams.user_level === "number")
    profileFilter.user_level = queryParams.user_level;
  if (typeof queryParams.auth_level === "number")
    profileFilter.auth_level = queryParams.auth_level;
  if (Object.keys(profileFilter).length > 0) where.profile = profileFilter;

  if (queryParams.search) {
    and.push({
      OR: [
        { username: { startsWith: queryParams.search } },
        { profile: { displayname: { startsWith: queryParams.search } } },
      ],
    });
  }

  if (and.length > 0) where.AND = and;

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
        omit: {
          password: true,
        },
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

  // Sign each profile's stored (unsigned) avatar / rank badge URLs.
  const signedUsers = users.map((u) => ({
    ...u,
    profile: signProfileImages(u.profile),
  }));

  return {
    users: signedUsers,
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
