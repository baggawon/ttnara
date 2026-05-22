import type {
  profile,
  tether,
  tether_category,
  tether_proposal,
  tether_rate,
  tether_region_selection,
  user,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import type { ManipulateType } from "dayjs";
import { forEach, now } from "@/helpers/basic";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import {
  signCloudFrontUrlsInHtml,
  signStoredCloudFrontUrl,
} from "@/helpers/server/s3";
import {
  getUser,
  paginationManager,
  requestValidator,
  RequestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import {
  Currency,
  SearchType,
  TetherOrderby,
  TetherProposalStatus,
  TetherRange,
  TetherStatus,
  type PaginationInfo,
} from "@/helpers/types";
import { getServerSession } from "next-auth";

export interface AuthProfile
  extends Pick<
    user,
    | "username"
    | "last_login"
    | "trade_total"
    | "trade_count"
    | "trade_joined"
    | "trade_rate"
  > {
  profile: Pick<
    profile,
    "displayname" | "phone_is_validated" | "kyc_id" | "is_app_admin"
  > | null;
}

export interface TetherRegionSelectionWithCategory
  extends tether_region_selection {
  category: tether_category;
}

export interface TetherWithProfile extends tether {
  user: AuthProfile | null;
  tether_proposals: TradeProposalWithProfile[];
  _count: { tether_proposals: number };
  region_selections: TetherRegionSelectionWithCategory[];
}

export type TetherPublic = Pick<
  tether,
  | "id"
  | "title"
  | "condition"
  | "use_author"
  | "price"
  | "margin"
  | "min_qty"
  | "max_qty"
  | "trade_type"
  | "currency"
  | "status"
  | "created_at"
  | "price_type"
  | "address_type"
  | "custom_address"
  | "contact_method"
  | "contact_id"
  | "preferred_time"
  | "hide_contact"
>;
export interface TetherPublicWithProfile extends TetherPublic {
  user: AuthProfile | null;
  tether_proposals: TradeProposalWithProfile[];
  _count: { tether_proposals: number };
  region_selections: TetherRegionSelectionWithCategory[];
}

export type TradeRatePublic = Pick<tether_rate, "id" | "user_id">;

export interface TradeProposalWithProfile extends tether_proposal {
  user: AuthProfile | null;
  tether_rate: TradeRatePublic[];
}

export interface TetherListResponse {
  tethers: (TetherWithProfile | TetherPublicWithProfile)[];
  pagination: PaginationInfo;
  tether_categories: tether_category[];
}

export interface TethersReadProps {
  page: number;
  pageSize: number;
  currency?: string;
  orderby?: TetherOrderby;
  search?: string;
  column?: string;
  category_name?: string;
  tether_id?: number;
  status?: TetherStatus;
  usePersonal?: boolean;
  range?: TetherRange;
  region?: string;
}

export const tetherPublicSelect: { [K in keyof TetherPublic]: boolean } = {
  id: true,
  title: true,
  condition: true,
  use_author: true,
  price: true,
  margin: true,
  min_qty: true,
  max_qty: true,
  trade_type: true,
  currency: true,
  status: true,
  price_type: true,
  address_type: true,
  custom_address: true,
  contact_method: true,
  contact_id: true,
  preferred_time: true,
  hide_contact: true,
  created_at: true,
};

export const tetherPrivateSelect: { [K in keyof tether]: boolean } = {
  id: true,
  user_id: true,
  title: true,
  condition: true,
  condition_format: true,
  use_author: true,
  price: true,
  margin: true,
  min_qty: true,
  max_qty: true,
  trade_type: true,
  currency: true,
  status: true,
  price_type: true,
  address_type: true,
  custom_address: true,
  contact_method: true,
  contact_id: true,
  preferred_time: true,
  hide_contact: true,
  created_at: true,
  updated_at: true,
};

export const tetherInclude = (tether_proposal_where?: object) => ({
  user: {
    select: {
      username: true,
      last_login: true,
      trade_total: true,
      trade_count: true,
      trade_joined: true,
      trade_rate: true,
      profile: {
        select: {
          displayname: true,
          phone_is_validated: true,
          kyc_id: true,
          is_app_admin: true,
          has_warranty: true,
          warranty_deposit_amount: true,
          current_rank_level: true,
          current_rank_name: true,
          current_rank_image: true,
        },
      },
    },
  },
  region_selections: {
    include: {
      category: true,
    },
  },
  tether_proposals: {
    ...(tether_proposal_where && { where: tether_proposal_where }),
    include: {
      user: {
        select: {
          username: true,
          last_login: true,
          trade_total: true,
          trade_count: true,
          trade_joined: true,
          trade_rate: true,
          profile: {
            select: {
              displayname: true,
              phone_is_validated: true,
              kyc_id: true,
              is_app_admin: true,
              has_warranty: true,
              current_rank_level: true,
              current_rank_name: true,
              current_rank_image: true,
            },
          },
        },
      },
      tether_rate: {
        select: {
          id: true,
          user_id: true,
        },
      },
    },
    orderBy: {
      created_at: Prisma.SortOrder.asc,
    },
  },
  _count: {
    select: {
      tether_proposals: {
        where: {
          status: TetherProposalStatus.Complete,
        },
      },
    },
  },
});

const stripHiddenContact = <T extends { hide_contact: boolean }>(tether: T) => {
  if (tether.hide_contact) {
    (tether as any).contact_method = null;
    (tether as any).contact_id = null;
    (tether as any).preferred_time = null;
  }
  return tether;
};

const signRankImageOnProfile = (profile: any) => {
  if (profile?.current_rank_image) {
    profile.current_rank_image = signStoredCloudFrontUrl(
      profile.current_rank_image
    );
  }
};

// Signs every CloudFront URL a tether exposes to the client: the rank badge
// on each profile, plus any images embedded in the `condition` rich-text HTML.
export const signTetherImages = (tether: any) => {
  signRankImageOnProfile(tether?.user?.profile);
  if (Array.isArray(tether?.tether_proposals)) {
    for (const p of tether.tether_proposals) {
      signRankImageOnProfile(p?.user?.profile);
    }
  }
  if (typeof tether?.condition === "string" && tether.condition) {
    tether.condition = signCloudFrontUrlsInHtml(tether.condition);
  }
  return tether;
};

async function getTethersWithPagination(
  queryParams: any
): Promise<TetherListResponse> {
  let tether_categories = appCache.getByKey(CacheKey.TetherCategories) as
    | tether_category[]
    | undefined;

  // Self-heal: cache is in-memory and may be empty after a dev-server restart
  // (no boot-time initialization on this route). If it's missing, refresh.
  if (!Array.isArray(tether_categories) || tether_categories.length === 0) {
    await appCache.refreshCache(CacheKey.TetherCategories);
    tether_categories = appCache.getByKey(CacheKey.TetherCategories) as
      | tether_category[]
      | undefined;
  }
  if (!Array.isArray(tether_categories)) tether_categories = [];

  /// 세부 검색시
  if (typeof queryParams?.id === "number") {
    const manager = paginationManager(queryParams);
    const tether_id = parseInt(queryParams.id);

    if (tether_id === 0)
      return {
        tethers: [],
        pagination: manager.getPagination(),
        tether_categories,
      };

    let uid = "";
    let kycId: null | string = null;
    try {
      const result = await requestValidator(
        [RequestValidator.User],
        queryParams
      );
      uid = result.uid!;
      kycId = result.kycId;
    } catch (_err) {
      return {
        tethers: [],
        pagination: manager.getPagination(),
        tether_categories,
      };
    }

    let tether = await handleConnect((prisma) =>
      prisma.tether.findFirst({
        where: {
          id: tether_id,
        },
        select: {
          ...tetherPrivateSelect,
          ...tetherInclude({
            status: {
              in: [TetherProposalStatus.Open, TetherProposalStatus.Complete],
            },
          }),
        },
      })
    );

    if (!tether) throw ToastData.unknown;

    const owner = tether.user_id === uid;
    const proposal = tether.tether_proposals.some(
      (proposal) => proposal.user_id === uid
    );
    const isOpen = tether.status === TetherProposalStatus.Open;

    const hasKYC = tether.use_author ? kycId !== null : true;

    if (!owner && !proposal && (!isOpen || !hasKYC))
      return {
        tethers: [],
        pagination: manager.getPagination(),
        tether_categories,
      };

    if (!owner) {
      const new_tether: any = {};
      forEach(
        [
          ...Object.keys(tetherPublicSelect),
          "tether_proposals",
          "region_selections",
          "user",
          "_count",
        ],
        (key) => {
          new_tether[key] = (tether as any)[key];
        }
      );
      tether = new_tether;
    }

    stripHiddenContact(tether as any);
    signTetherImages(tether);

    return {
      tethers: [tether!],
      pagination: manager.getPagination(),
      tether_categories,
    };
  }
  const json = queryParams as any as TethersReadProps;

  const manager = paginationManager(json);

  const getRangeHours = (
    range: TetherRange
  ): { value: number; unit: ManipulateType } => {
    switch (range) {
      case TetherRange.Total:
        return { value: 3, unit: "months" };
      case TetherRange.In24Hours:
        return { value: 24, unit: "hours" };
      case TetherRange.InOneWeek:
        return { value: 7, unit: "days" };
      case TetherRange.InOneMonth:
        return { value: 1, unit: "months" };
      default:
        return { value: 3, unit: "months" };
    }
  };

  // Match the selected parent region itself OR any of its child categories,
  // since tethers may be associated with leaf children (e.g. "강남구") rather
  // than the parent ("서울"). Categories are already cached, so this is in-memory.
  const regionCategoryIds = (() => {
    if (!json.region) return null;
    const parent = tether_categories.find((c) => c.name === json.region);
    if (!parent) return [];
    const childIds = tether_categories
      .filter((c) => c.parent_id === parent.id)
      .map((c) => c.id);
    return [parent.id, ...childIds];
  })();

  const where: Prisma.tetherWhereInput = {
    ...(json.category_name && {
      trade_type: json.category_name,
    }),
    ...(json.currency &&
      json.currency !== Currency.원화 && {
        currency: json.currency,
      }),
    ...(regionCategoryIds && {
      region_selections: {
        some: {
          category_id: { in: regionCategoryIds },
        },
      },
    }),
    status: {
      notIn: [TetherStatus.Cancel],
      ...(json.status &&
        json.status !== TetherStatus.Total && {
          in: [
            json.status,
            ...(json.status === TetherStatus.MyPageProgress
              ? [TetherStatus.Progress]
              : []),
          ],
        }),
    },
  };

  if (json.usePersonal !== true && json.range) {
    const { value, unit } = getRangeHours(json.range);
    where.created_at = {
      gte: now().subtract(value, unit).toDate(),
    };
  }

  if (json.usePersonal) {
    const session = await getServerSession(authOptions);
    let uid = "";
    if (session !== null) {
      const userData = await getUser(session);
      if (userData) {
        uid = userData.id;
      }
    }
    where.OR = [
      { user_id: uid! },
      {
        tether_proposals: {
          some: {
            user_id: uid!,
            status: {
              in: [TetherProposalStatus.Complete, TetherProposalStatus.Open],
            },
          },
        },
      },
    ];
  }

  if (json.search) {
    if (!where.OR) {
      where.OR = [];
    }
    switch (json.column) {
      case SearchType.제목:
        where.OR.push({ title: { contains: json.search } });
        break;
      case SearchType.내용:
        where.OR.push({ condition: { contains: json.search } });
        break;
      case SearchType.제목_내용:
        where.OR.push({ title: { contains: json.search } });
        where.OR.push({ condition: { contains: json.search } });
        break;
      case SearchType.회원아이디:
        where.OR.push({
          user: { username: { contains: json.search } },
        });
        break;
      case SearchType.글쓴이:
        where.OR.push({
          user: {
            profile: { displayname: { contains: json.search } },
          },
        });
        break;
    }
  }

  const { page, pageSize } = manager.getPageInfo();

  let orderBy: Prisma.tetherOrderByWithRelationInput = { created_at: "desc" };
  if (json.orderby === TetherOrderby.PriceCheap) {
    orderBy = { price: "asc" };
  } else if (json.orderby === TetherOrderby.PriceExpensive) {
    orderBy = { price: "desc" };
  } else if (json.orderby === TetherOrderby.GoodTrader) {
    orderBy = { user: { trade_rate: "desc" } };
  }

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.tether.count({ where }),

      prisma.tether.findMany({
        where,
        select: {
          ...tetherPublicSelect,
          ...tetherInclude({ id: 0 }),
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
  );
  if (!result) throw ToastData.unknown;
  const totalCount = result[0];
  const tethers = result[1];

  if (!tethers || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  forEach(tethers as any[], (t) => {
    stripHiddenContact(t);
    signTetherImages(t);
  });

  return {
    tethers,
    pagination: manager.getPagination(),
    tether_categories,
  };
}

export async function GET(queryParams: any) {
  try {
    const response = await getTethersWithPagination(queryParams);
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
