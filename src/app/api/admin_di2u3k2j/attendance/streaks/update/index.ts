import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface AttendanceStreakUpdateProps {
  id: number;
  day_count: number;
  bonus_points: number;
  label?: string | null;
  is_active?: boolean;
}

const DUPLICATE_DAY = "이미 등록된 연속일수입니다.";

export const POST = async (json: AttendanceStreakUpdateProps) => {
  try {
    if (typeof json?.id !== "number") throw ToastData.unknown;
    await requestValidator([RequestValidator.Admin], json);

    const day_count = Math.floor(Number(json?.day_count));
    const bonus_points = Math.floor(Number(json?.bonus_points));
    if (!Number.isFinite(day_count) || day_count < 1)
      throw "연속일수는 1 이상이어야 합니다.";
    if (!Number.isFinite(bonus_points) || bonus_points < 0)
      throw "보너스 포인트는 0 이상이어야 합니다.";

    // day_count is @unique — block collisions with a different row up-front for
    // a friendly message (handleConnect would otherwise swallow the P2002).
    const clash = await handleConnect((prisma) =>
      prisma.attendance_streak.findUnique({
        where: { day_count },
        select: { id: true },
      })
    );
    if (clash && clash.id !== json.id) throw DUPLICATE_DAY;

    const updated = await handleConnect((prisma) =>
      prisma.attendance_streak.update({
        where: { id: json.id },
        data: {
          day_count,
          bonus_points,
          label: json?.label?.trim() || null,
          is_active: json?.is_active ?? true,
        },
      })
    );
    if (!updated) throw ToastData.unknown;

    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
