import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { applyAttendancePoints } from "@/helpers/server/pointService";
import { kstToday, kstYesterday } from "@/helpers/server/attendanceTime";
import { sanitizeStoredHtml } from "@/helpers/server/sanitizeHtml";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import type { attendance_setting } from "@prisma/client";

export interface AttendanceCheckinProps {
  comment: string;
  comment_format?: "html" | "markdown";
}

export interface AttendanceCheckinResult {
  consecutive_day: number;
  cycle_position: number;
  awarded: number;
  milestoneHit: boolean;
  balance: number;
}

const COMMENT_MAX_LENGTH = 500;
const ALREADY_CHECKED_IN = "이미 오늘 출석체크를 했습니다.";

export const POST = async (json: AttendanceCheckinProps) => {
  try {
    const { uid } = await requestValidator([RequestValidator.User], json);
    if (!uid) throw ToastData.noAuth;

    const raw = (json?.comment ?? "").trim();
    if (!raw) throw "출석 한마디를 입력해주세요.";
    const comment = sanitizeStoredHtml(raw).slice(0, COMMENT_MAX_LENGTH);
    if (!comment) throw "출석 한마디를 입력해주세요.";
    const comment_format =
      json?.comment_format === "markdown" ? "markdown" : "html";

    // Cached singleton; falls back to a DB read if the cache is cold.
    let setting = appCache.getByKey(CacheKey.AttendanceSetting) as
      | attendance_setting
      | null
      | undefined;
    if (!setting) {
      setting = await handleConnect((prisma) =>
        prisma.attendance_setting.findFirst({ orderBy: { id: "asc" } })
      );
    }
    if (setting && setting.is_enabled === false) {
      throw "출석체크가 비활성화되어 있습니다.";
    }
    const daily_points = setting?.daily_points ?? 0;

    const today = kstToday();
    const yesterday = kstYesterday();

    // Primary duplicate guard: the @@unique([uid, kst_date]) inside the
    // transaction is the source of truth, but a cheap pre-check returns a
    // friendly message in the common case without entering the transaction.
    const existing = await handleConnect((prisma) =>
      prisma.attendance_record.findUnique({
        where: { uid_kst_date: { uid, kst_date: today } },
        select: { id: true },
      })
    );
    if (existing) throw ALREADY_CHECKED_IN;

    const result = await handleConnect((prisma) =>
      prisma.$transaction(async (tx) => {
        const milestones = await tx.attendance_streak.findMany({
          where: { is_active: true },
          orderBy: { day_count: "asc" },
          select: { day_count: true, bonus_points: true },
        });
        const maxDay = milestones.length
          ? milestones[milestones.length - 1].day_count
          : 0;

        const prev = await tx.attendance_record.findUnique({
          where: { uid_kst_date: { uid, kst_date: yesterday } },
          select: { consecutive_day: true },
        });
        const consecutive_day = prev ? prev.consecutive_day + 1 : 1;
        const cycle_position =
          maxDay > 0 ? ((consecutive_day - 1) % maxDay) + 1 : consecutive_day;

        const milestone = milestones.find(
          (m) => m.day_count === cycle_position
        );
        const bonus_points = milestone?.bonus_points ?? 0;

        // Insert first — the unique constraint aborts the whole tx (and the
        // point award below) on a concurrent double-submit.
        const record = await tx.attendance_record.create({
          data: {
            uid,
            kst_date: today,
            consecutive_day,
            cycle_position,
            base_points: daily_points,
            bonus_points,
            comment,
            comment_format,
          },
          select: { id: true },
        });

        const balance = await applyAttendancePoints(tx, {
          uid,
          base_points: daily_points,
          bonus_points,
          ref_id: record.id,
        });

        return {
          consecutive_day,
          cycle_position,
          awarded: daily_points + bonus_points,
          milestoneHit: !!milestone,
          balance,
        } satisfies AttendanceCheckinResult;
      })
    );

    if (!result) {
      // The transaction was rolled back. The most likely cause after a passing
      // pre-check is a concurrent double-submit hitting the unique constraint —
      // confirm by re-reading and surface the friendly message when so.
      const now = await handleConnect((prisma) =>
        prisma.attendance_record.findUnique({
          where: { uid_kst_date: { uid, kst_date: today } },
          select: { id: true },
        })
      );
      if (now) throw ALREADY_CHECKED_IN;
      throw ToastData.unknown;
    }

    return { result: true, data: result };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
