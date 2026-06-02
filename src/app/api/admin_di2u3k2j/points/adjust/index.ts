import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { adjustPoints } from "@/helpers/server/pointService";

export interface pointAdjustProps {
  target_uid: string;
  amount: number;
  note?: string;
}

export const POST = async (json: pointAdjustProps) => {
  try {
    if (typeof json?.target_uid !== "string" || json.target_uid === "") {
      throw new Error("Invalid target_uid");
    }
    if (typeof json?.amount !== "number" || !Number.isInteger(json.amount)) {
      throw new Error("amount must be an integer");
    }
    if (json.amount === 0) {
      throw new Error("amount must not be 0");
    }
    if (json.note && typeof json.note !== "string") {
      throw new Error("note must be a string");
    }
    if (json.note && json.note.length > 500) {
      throw new Error("note too long (max 500)");
    }

    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!adminUid) {
      throw new Error("admin required");
    }

    const adjusted = await adjustPoints({
      uid: json.target_uid,
      amount: json.amount,
      admin_uid: adminUid,
      note: json.note,
    });
    if (!adjusted) {
      throw new Error("포인트 조정에 실패했습니다. 대상 회원을 확인해주세요.");
    }

    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
