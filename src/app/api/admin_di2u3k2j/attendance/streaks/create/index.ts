import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface AttendanceStreakCreateProps {
  day_count: number;
  bonus_points: number;
  label?: string | null;
  is_active?: boolean;
}

const DUPLICATE_DAY = "이미 등록된 연속일수입니다.";

export const POST = async (json: AttendanceStreakCreateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const day_count = Math.floor(Number(json?.day_count));
    const bonus_points = Math.floor(Number(json?.bonus_points));
    if (!Number.isFinite(day_count) || day_count < 1)
      throw "연속일수는 1 이상이어야 합니다.";
    if (!Number.isFinite(bonus_points) || bonus_points < 0)
      throw "보너스 포인트는 0 이상이어야 합니다.";

    const existing = await handleConnect((prisma) =>
      prisma.attendance_streak.findUnique({
        where: { day_count },
        select: { id: true },
      })
    );
    if (existing) throw DUPLICATE_DAY;

    const created = await handleConnect((prisma) =>
      prisma.attendance_streak.create({
        data: {
          day_count,
          bonus_points,
          label: json?.label?.trim() || null,
          is_active: json?.is_active ?? true,
        },
      })
    );
    if (!created) throw ToastData.unknown;

    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
