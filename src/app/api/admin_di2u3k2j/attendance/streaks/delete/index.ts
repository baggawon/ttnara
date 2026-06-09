import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface AttendanceStreakDeleteProps {
  deleteStreakId: number;
}

export const POST = async (json: AttendanceStreakDeleteProps) => {
  try {
    if (typeof json?.deleteStreakId !== "number") throw ToastData.unknown;
    await requestValidator([RequestValidator.Admin], json);

    // attendance_record snapshots its own awarded points, so removing a
    // milestone never corrupts history — a plain delete is safe.
    const deleted = await handleConnect((prisma) =>
      prisma.attendance_streak.delete({ where: { id: json.deleteStreakId } })
    );
    if (!deleted) throw ToastData.unknown;

    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
