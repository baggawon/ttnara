import { handleConnect } from "@/helpers/server/prisma";
import { Prisma } from "@prisma/client";
import {
  PointKind,
  PointAction,
  REFUND_WINDOW_HOURS,
} from "@/helpers/pointSystem";
import { updateUserBoardRank } from "@/helpers/server/boardRankEvaluator";

interface AwardPointsArgs {
  uid: string;
  amount: number;
  action: PointAction | string;
  kind?: PointKind;
  topic_id?: number;
  thread_id?: number;
  comment_id?: number;
  ref_type?: string;
  ref_id?: number;
  admin_uid?: string;
  note?: string;
}

// Returns true only when the increment + history row both committed. The tx
// callback returns a `true` sentinel because handleConnect swallows errors and
// returns undefined — without the sentinel a swallowed failure is
// indistinguishable from a successful run (both would resolve to undefined).
const writePointEntry = async (args: AwardPointsArgs): Promise<boolean> => {
  if (args.amount === 0) return true;

  const ok = await handleConnect((prisma) =>
    prisma.$transaction(async (tx) => {
      // profile.update throws P2025 if the uid has no profile row, aborting the
      // transaction; handleConnect then returns undefined and `ok` stays falsy.
      const profile = await tx.profile.update({
        where: { uid: args.uid },
        data: { point: { increment: args.amount } },
        select: { point: true },
      });

      // Board rank tracks current balance — re-evaluate on every change.
      await updateUserBoardRank(tx, args.uid, profile.point);

      await tx.point_history.create({
        data: {
          uid: args.uid,
          amount: args.amount,
          balance: profile.point,
          kind: args.kind ?? PointKind.earn,
          action: args.action,
          topic_id: args.topic_id ?? null,
          thread_id: args.thread_id ?? null,
          comment_id: args.comment_id ?? null,
          ref_type: args.ref_type ?? null,
          ref_id: args.ref_id ?? null,
          admin_uid: args.admin_uid ?? null,
          note: args.note ?? null,
        },
      });

      return true as const;
    })
  );

  return ok === true;
};

export async function awardPoints(args: AwardPointsArgs): Promise<void> {
  await writePointEntry({ ...args, kind: PointKind.earn });
}

export type ApplyTopicPointsResult =
  | { ok: true; balance: number; applied: number }
  | { ok: false; reason: "insufficient_balance"; balance: number };

/**
 * Apply a signed topic point delta to a user inside an existing transaction.
 * Positive = award, negative = spend with atomic balance guard, zero = noop.
 * Caller must run this inside `prisma.$transaction` so a spend failure can
 * roll back the surrounding action (post/comment/vote creation).
 */
export async function applyTopicPoints(
  tx: Prisma.TransactionClient,
  args: {
    uid: string;
    amount: number;
    action: PointAction | string;
    topic_id?: number;
    thread_id?: number;
    comment_id?: number;
  }
): Promise<ApplyTopicPointsResult> {
  if (args.amount === 0) {
    const cur = await tx.profile.findUnique({
      where: { uid: args.uid },
      select: { point: true },
    });
    return { ok: true, balance: cur?.point ?? 0, applied: 0 };
  }

  if (args.amount > 0) {
    const profile = await tx.profile.update({
      where: { uid: args.uid },
      data: { point: { increment: args.amount } },
      select: { point: true },
    });
    await updateUserBoardRank(tx, args.uid, profile.point);
    await tx.point_history.create({
      data: {
        uid: args.uid,
        amount: args.amount,
        balance: profile.point,
        kind: PointKind.earn,
        action: args.action,
        topic_id: args.topic_id ?? null,
        thread_id: args.thread_id ?? null,
        comment_id: args.comment_id ?? null,
      },
    });
    return { ok: true, balance: profile.point, applied: args.amount };
  }

  const cost = Math.abs(args.amount);
  const updated = await tx.profile.updateMany({
    where: { uid: args.uid, point: { gte: cost } },
    data: { point: { decrement: cost } },
  });
  if (updated.count === 0) {
    const cur = await tx.profile.findUnique({
      where: { uid: args.uid },
      select: { point: true },
    });
    return {
      ok: false,
      reason: "insufficient_balance",
      balance: cur?.point ?? 0,
    };
  }
  const profile = await tx.profile.findUnique({
    where: { uid: args.uid },
    select: { point: true },
  });
  await updateUserBoardRank(tx, args.uid, profile?.point ?? 0);
  await tx.point_history.create({
    data: {
      uid: args.uid,
      amount: -cost,
      balance: profile?.point ?? 0,
      kind: PointKind.spend,
      action: args.action,
      topic_id: args.topic_id ?? null,
      thread_id: args.thread_id ?? null,
      comment_id: args.comment_id ?? null,
    },
  });
  return { ok: true, balance: profile?.point ?? 0, applied: args.amount };
}

/**
 * Award daily-attendance points inside an existing transaction so the point
 * grant is atomic with the attendance_record insert. Writes a base
 * `daily_checkin` history row plus a separate `attendance_streak_bonus` row
 * when a milestone bonus applies. Returns the resulting balance.
 */
export async function applyAttendancePoints(
  tx: Prisma.TransactionClient,
  args: {
    uid: string;
    base_points: number;
    bonus_points: number;
    ref_id?: number;
  }
): Promise<number> {
  const total = args.base_points + args.bonus_points;

  // profile.update throws P2025 if the uid has no profile row, aborting the tx.
  const profile = await tx.profile.update({
    where: { uid: args.uid },
    data: { point: { increment: total } },
    select: { point: true },
  });

  await updateUserBoardRank(tx, args.uid, profile.point);

  // balance after the base award (history rows are written in award order).
  const balanceAfterBase = profile.point - args.bonus_points;

  if (args.base_points !== 0) {
    await tx.point_history.create({
      data: {
        uid: args.uid,
        amount: args.base_points,
        balance: balanceAfterBase,
        kind: PointKind.earn,
        action: PointAction.daily_checkin,
        ref_type: "attendance",
        ref_id: args.ref_id ?? null,
      },
    });
  }

  if (args.bonus_points !== 0) {
    await tx.point_history.create({
      data: {
        uid: args.uid,
        amount: args.bonus_points,
        balance: profile.point,
        kind: PointKind.earn,
        action: PointAction.attendance_streak_bonus,
        ref_type: "attendance",
        ref_id: args.ref_id ?? null,
      },
    });
  }

  return profile.point;
}

export async function getBalance(uid: string): Promise<number> {
  const profile = await handleConnect((prisma) =>
    prisma.profile.findUnique({ where: { uid }, select: { point: true } })
  );
  return profile?.point ?? 0;
}

export type SpendFailureReason =
  | "insufficient_balance"
  | "profile_not_found"
  | "invalid_amount"
  | "db_error";

export type SpendResult =
  | { ok: true; balance: number }
  | { ok: false; reason: SpendFailureReason; balance: number };

/**
 * Atomically decrement the user's balance and write a spend entry.
 *
 * Concurrency-safe: relies on `updateMany` with a `point: { gte: amount }`
 * guard so simultaneous spends cannot overdraw. Returns a discriminated
 * result rather than throwing so callers can branch on insufficient balance.
 */
export async function spendPoints(args: {
  uid: string;
  amount: number;
  action: PointAction | string;
  ref_type?: string;
  ref_id?: number;
  note?: string;
}): Promise<SpendResult> {
  if (!Number.isInteger(args.amount) || args.amount <= 0) {
    return { ok: false, reason: "invalid_amount", balance: 0 };
  }

  const result = await handleConnect((prisma) =>
    prisma.$transaction(async (tx) => {
      const updated = await tx.profile.updateMany({
        where: { uid: args.uid, point: { gte: args.amount } },
        data: { point: { decrement: args.amount } },
      });

      if (updated.count === 0) {
        const current = await tx.profile.findUnique({
          where: { uid: args.uid },
          select: { point: true },
        });
        if (!current) {
          return {
            ok: false as const,
            reason: "profile_not_found" as const,
            balance: 0,
          };
        }
        return {
          ok: false as const,
          reason: "insufficient_balance" as const,
          balance: current.point,
        };
      }

      const profile = await tx.profile.findUnique({
        where: { uid: args.uid },
        select: { point: true },
      });
      if (!profile) {
        return {
          ok: false as const,
          reason: "profile_not_found" as const,
          balance: 0,
        };
      }

      await updateUserBoardRank(tx, args.uid, profile.point);

      await tx.point_history.create({
        data: {
          uid: args.uid,
          amount: -args.amount,
          balance: profile.point,
          kind: PointKind.spend,
          action: args.action,
          ref_type: args.ref_type ?? null,
          ref_id: args.ref_id ?? null,
          note: args.note ?? null,
        },
      });

      return { ok: true as const, balance: profile.point };
    })
  );

  return result ?? { ok: false, reason: "db_error", balance: 0 };
}

// Returns false when the adjustment did not persist (e.g. unknown uid) so the
// admin route can surface a real error instead of a false success.
export async function adjustPoints(args: {
  uid: string;
  amount: number;
  admin_uid: string;
  note?: string;
}): Promise<boolean> {
  if (args.amount === 0) return true;
  return writePointEntry({
    uid: args.uid,
    amount: args.amount,
    kind: PointKind.adjust,
    action:
      args.amount > 0 ? PointAction.admin_grant : PointAction.admin_deduct,
    admin_uid: args.admin_uid,
    note: args.note,
  });
}

const isWithinRefundWindow = (createdAt: Date): boolean => {
  const elapsedHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return elapsedHours <= REFUND_WINDOW_HOURS;
};

export async function refundThreadAuthor(args: {
  thread_id: number;
  author_uid: string;
  created_at: Date;
}): Promise<void> {
  if (!isWithinRefundWindow(args.created_at)) return;

  const rows = await handleConnect((prisma) =>
    prisma.point_history.findMany({
      where: {
        thread_id: args.thread_id,
        uid: args.author_uid,
        kind: PointKind.earn,
        action: PointAction.post_create,
      },
      select: { amount: true },
    })
  );

  if (!rows || rows.length === 0) return;

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  if (total <= 0) return;

  await writePointEntry({
    uid: args.author_uid,
    amount: -total,
    kind: PointKind.refund,
    action: PointAction.thread_delete_refund,
    thread_id: args.thread_id,
    note: `삭제로 회수된 ${rows.length}건의 적립 (${total}P)`,
  });
}

export async function refundCommentAuthor(args: {
  comment_id: number;
  author_uid: string;
  created_at: Date;
  thread_id?: number;
}): Promise<void> {
  if (!isWithinRefundWindow(args.created_at)) return;

  const rows = await handleConnect((prisma) =>
    prisma.point_history.findMany({
      where: {
        comment_id: args.comment_id,
        uid: args.author_uid,
        kind: PointKind.earn,
        action: PointAction.comment_create,
      },
      select: { amount: true },
    })
  );

  if (!rows || rows.length === 0) return;

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  if (total <= 0) return;

  await writePointEntry({
    uid: args.author_uid,
    amount: -total,
    kind: PointKind.refund,
    action: PointAction.comment_delete_refund,
    comment_id: args.comment_id,
    thread_id: args.thread_id,
    note: `삭제로 회수된 댓글 적립 (${total}P)`,
  });
}
