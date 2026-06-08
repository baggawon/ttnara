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

export type UsersSortOption =
  | "created_desc"
  | "created_asc"
  | "deposit_desc"
  | "deposit_asc"
  | "rank_desc"
  | "rank_asc"
  | "board_rank_desc"
  | "board_rank_asc";

export type UsersKycFilter = "verified" | "simulation" | "unregistered";

export interface UsersReadProps {
  page: number;
  pageSize: number;
  is_active?: boolean;
  is_admin?: boolean;
  has_warranty?: boolean;
  kyc?: UsersKycFilter;
  sort?: UsersSortOption;
  user_level?: number;
  auth_level?: number;
  search?: string;
}

async function getUsersWithPagination(
  queryParams: any
): Promise<UsersListResponse> {
  // 정렬 기준 — single orderBy so the sort is never ambiguous. Rank/deposit
  // sorts order by the to-one `profile` relation's scalar.
  let orderBy: Prisma.userOrderByWithRelationInput;
  switch (queryParams?.sort) {
    case "created_asc":
      orderBy = { created_at: Prisma.SortOrder.asc };
      break;
    case "deposit_desc":
      orderBy = { profile: { warranty_deposit_amount: Prisma.SortOrder.desc } };
      break;
    case "deposit_asc":
      orderBy = { profile: { warranty_deposit_amount: Prisma.SortOrder.asc } };
      break;
    case "rank_desc":
      orderBy = { profile: { current_rank_level: Prisma.SortOrder.desc } };
      break;
    case "rank_asc":
      orderBy = { profile: { current_rank_level: Prisma.SortOrder.asc } };
      break;
    case "board_rank_desc":
      orderBy = {
        profile: { current_board_rank_level: Prisma.SortOrder.desc },
      };
      break;
    case "board_rank_asc":
      orderBy = {
        profile: { current_board_rank_level: Prisma.SortOrder.asc },
      };
      break;
    case "created_desc":
    default:
      orderBy = { created_at: Prisma.SortOrder.desc };
      break;
  }
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
  // overwriting, so user_level, auth_level and has_warranty can all apply.
  const profileFilter: Prisma.profileWhereInput = {};
  if (typeof queryParams.user_level === "number")
    profileFilter.user_level = queryParams.user_level;
  if (typeof queryParams.auth_level === "number")
    profileFilter.auth_level = queryParams.auth_level;
  if (typeof queryParams.has_warranty === "boolean")
    profileFilter.has_warranty = queryParams.has_warranty;
  if (Object.keys(profileFilter).length > 0) where.profile = profileFilter;

  // KYC 3-state: kyc_id is null (미등록), "0" (시뮬레이션) or numeric > 0
  // (인증완료). 인증완료 excludes both null and "0".
  if (queryParams.kyc === "verified") {
    and.push({ profile: { kyc_id: { not: null } } });
    and.push({ profile: { kyc_id: { not: "0" } } });
  }
  if (queryParams.kyc === "simulation") and.push({ profile: { kyc_id: "0" } });
  if (queryParams.kyc === "unregistered")
    and.push({ profile: { kyc_id: null } });

  if (queryParams.search) {
    and.push({
      OR: [
        { username: { startsWith: queryParams.search } },
        { profile: { displayname: { startsWith: queryParams.search } } },
        { profile: { email: { startsWith: queryParams.search } } },
      ],
    });
  }

  if (and.length > 0) where.AND = and;

  // Whitelist the admin-selectable page sizes; fall back to 10 for anything else.
  const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
  const requestedPageSize = ALLOWED_PAGE_SIZES.includes(queryParams.pageSize)
    ? queryParams.pageSize
    : 10;

  const manager = paginationManager(queryParams, {
    pageSize: requestedPageSize,
  });
  const { page, pageSize } = manager.getPageInfo();

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.user.count({
        where,
      }),
      prisma.user.findMany({
        where,
        orderBy,
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
