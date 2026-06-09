import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface AttendanceSettingUpdateProps {
  is_enabled?: boolean;
  daily_points?: number;
}

export const POST = async (json: AttendanceSettingUpdateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const data: { is_enabled?: boolean; daily_points?: number } = {};
    if (typeof json?.is_enabled === "boolean")
      data.is_enabled = json.is_enabled;
    if (typeof json?.daily_points === "number" && json.daily_points >= 0) {
      data.daily_points = Math.floor(json.daily_points);
    }

    // Singleton: always write the canonical (lowest-id) row so every reader
    // (orderBy id asc) sees the saved value and the form never "reverts".
    let canonical = await handleConnect((prisma) =>
      prisma.attendance_setting.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      })
    );
    if (!canonical) {
      canonical = await handleConnect((prisma) =>
        prisma.attendance_setting.create({ data: {}, select: { id: true } })
      );
    }
    if (!canonical) throw ToastData.unknown;

    const updateResult = await handleConnect((prisma) =>
      prisma.attendance_setting.update({ where: { id: canonical!.id }, data })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.AttendanceSetting);
    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
