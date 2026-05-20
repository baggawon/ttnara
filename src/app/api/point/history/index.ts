import {
  paginationManager,
  requestValidator,
  RequestValidator,
} from "@/helpers/server/serverFunctions";
import { type point_history, Prisma } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";
import { PointKind } from "@/helpers/pointSystem";

export interface PointHistoryItem {
  id: number;
  amount: number;
  balance: number;
  kind: string;
  action: string;
  topic_id: number | null;
  thread_id: number | null;
  comment_id: number | null;
  ref_type: string | null;
  ref_id: number | null;
  note: string | null;
  created_at: Date;
}

export interface PointHistorySummary {
  balance: number;
  monthEarn: number;
  monthSpend: number;
  monthRefund: number;
  monthAdjust: number;
  lifetimeEarn: number;
  lifetimeSpend: number;
}

export interface PointHistoryResponse {
  history: PointHistoryItem[];
  pagination: PaginationInfo;
  summary: PointHistorySummary;
}

export interface PointHistoryReadProps {
  page?: number;
  pageSize?: number;
  kind?: PointKind | "all";
  from?: string;
  to?: string;
}

const toItem = (row: point_history): PointHistoryItem => ({
  id: row.id,
  amount: row.amount,
  balance: row.balance,
  kind: row.kind,
  action: row.action,
  topic_id: row.topic_id,
  thread_id: row.thread_id,
  comment_id: row.comment_id,
  ref_type: row.ref_type,
  ref_id: row.ref_id,
  note: row.note,
  created_at: row.created_at,
});

const sumAmount = (
  rows: { amount: number }[],
  predicate: (n: number) => boolean
): number =>
  rows.reduce((acc, r) => (predicate(r.amount) ? acc + r.amount : acc), 0);

export const GET = async (queryParams: PointHistoryReadProps) => {
  try {
    const manager = paginationManager({
      page: queryParams.page ?? 1,
      pageSize: queryParams.pageSize ?? 20,
    } as any);

    const { uid } = await requestValidator(
      [RequestValidator.User],
      queryParams
    );
    if (!uid) throw ToastData.noAuth;

    const where: Prisma.point_historyWhereInput = { uid };
    if (queryParams.kind && queryParams.kind !== "all") {
      where.kind = queryParams.kind;
    }
    if (queryParams.from || queryParams.to) {
      where.created_at = {};
      if (queryParams.from) {
        (where.created_at as Prisma.DateTimeFilter).gte = new Date(
          queryParams.from
        );
      }
      if (queryParams.to) {
        (where.created_at as Prisma.DateTimeFilter).lte = new Date(
          queryParams.to
        );
      }
    }

    const { page, pageSize } = manager.getPageInfo();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const result = await handleConnect((prisma) =>
      Promise.all([
        prisma.point_history.count({ where }),
        prisma.point_history.findMany({
          where,
          orderBy: { created_at: Prisma.SortOrder.desc },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.profile.findUnique({
          where: { uid },
          select: { point: true },
        }),
        prisma.point_history.findMany({
          where: { uid, created_at: { gte: monthStart } },
          select: { amount: true, kind: true },
        }),
        prisma.point_history.findMany({
          where: { uid },
          select: { amount: true, kind: true },
        }),
      ])
    );
    if (!result) throw ToastData.unknown;

    const [totalCount, rows, profile, monthRows, lifetimeRows] = result;

    manager.setTotalCount(totalCount);

    const monthEarn = sumAmount(
      monthRows.filter((r) => r.kind === PointKind.earn),
      (n) => n > 0
    );
    const monthSpend = Math.abs(
      sumAmount(
        monthRows.filter((r) => r.kind === PointKind.spend),
        (n) => n < 0
      )
    );
    const monthRefund = Math.abs(
      sumAmount(
        monthRows.filter((r) => r.kind === PointKind.refund),
        (n) => n < 0
      )
    );
    const monthAdjust = sumAmount(
      monthRows.filter((r) => r.kind === PointKind.adjust),
      () => true
    );
    const lifetimeEarn = sumAmount(
      lifetimeRows.filter((r) => r.kind === PointKind.earn),
      (n) => n > 0
    );
    const lifetimeSpend = Math.abs(
      sumAmount(
        lifetimeRows.filter((r) => r.kind === PointKind.spend),
        (n) => n < 0
      )
    );

    const response: PointHistoryResponse = {
      history: rows.map(toItem),
      pagination: manager.getPagination(),
      summary: {
        balance: profile?.point ?? 0,
        monthEarn,
        monthSpend,
        monthRefund,
        monthAdjust,
        lifetimeEarn,
        lifetimeSpend,
      },
    };

    return { result: true, data: response };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
