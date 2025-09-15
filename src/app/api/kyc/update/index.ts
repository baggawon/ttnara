import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { getKYCToken } from "@/app/api/kyc";
import type { Prisma } from "@prisma/client";

export interface KycUpdateProps {
  id: number;
  result_type: number;
  finance_code: string | null;
  finance_company: string | null;
  account_number: string | null;
  account_holder: string | null;
  name: string | null;
  phone_number: string | null;
  birthday: string | null;
}

export const POST = async (json: KycUpdateProps) => {
  try {
    if (typeof json?.id !== "number") throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);

    const data: Prisma.XOR<
      Prisma.kycCreateInput,
      Prisma.kycUncheckedCreateInput
    > = {
      id: json.id,
      user_id: uid!,
      result_type: json.result_type,
    };

    if (json.result_type === 1) {
      if (json?.finance_code) data.prev_finance_code = json.finance_code;
      if (json?.finance_company)
        data.prev_finance_company = json.finance_company;
      if (json?.account_number) data.prev_account_number = json.account_number;
      if (json?.account_holder) data.prev_account_holder = json.account_holder;
      if (json?.name) data.prev_name = json.name;
      if (json?.phone_number) data.prev_phone_number = json.phone_number;
      if (json?.birthday) data.prev_birthday = json.birthday;

      const token = await getKYCToken("reviewer");
      const result = await fetch(
        `https://kyc-api.useb.co.kr/review/results/${json.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      const reviewResult = await result.json();
      // If Useb result is available, we update the data, and set trust_level to 1
      if (reviewResult?.detail?.account) {
        data.finance_code = reviewResult.detail.account.finance_code;
        data.finance_company = reviewResult.detail.account.finance_company;
        data.account_number = reviewResult.detail.account.account_number;
        data.account_holder = reviewResult.detail.account.account_holder;
        data.trust_level = 1;
      } else {
        // If Useb result is not available, we update the data, and set trust_level to 0
        data.finance_code = json.finance_code;
        data.finance_company = json.finance_company;
        data.account_number = json.account_number;
        data.account_holder = json.account_holder;
        data.trust_level = 0;
      }
      // Update profile regardless of the reviewResult
      const updateResult = await handleConnect((prisma) =>
        prisma.profile.update({
          where: {
            uid: uid!,
          },
          data: {
            kyc_id: String(json.id),
            name: reviewResult?.detail?.name || json.name || undefined,
            phone_number:
              reviewResult?.detail?.phone_number ||
              json.phone_number ||
              undefined,
            birthday:
              reviewResult?.detail?.birthday || json.birthday || undefined,
          },
        })
      );
      if (!updateResult) throw ToastData.unknown;
    }

    const createResult = await handleConnect((prisma) =>
      prisma.kyc.create({
        data,
      })
    );
    if (!createResult) throw ToastData.unknown;

    return {
      result: true,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
