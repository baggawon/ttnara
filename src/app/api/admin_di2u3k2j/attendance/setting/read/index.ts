import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { attendance_setting } from "@prisma/client";

export interface AttendanceSettingReadResult {
  id: number;
  is_enabled: boolean;
  daily_points: number;
}

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    let setting: attendance_setting | null | undefined = await handleConnect(
      (prisma) =>
        prisma.attendance_setting.findFirst({ orderBy: { id: "asc" } })
    );
    if (!setting) {
      setting = await handleConnect((prisma) =>
        prisma.attendance_setting.create({ data: {} })
      );
    }
    if (!setting) throw ToastData.unknown;

    const data: AttendanceSettingReadResult = {
      id: setting.id,
      is_enabled: setting.is_enabled,
      daily_points: setting.daily_points,
    };
    return { result: true, data };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
