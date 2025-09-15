import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.User], queryParams);

    return {
      result: true,
      data: await getKYCToken("user"),
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};

export type KYCLoginType = "user" | "reviewer";
export const getKYCToken = async (type: KYCLoginType) => {
  const result = await fetch("https://kyc-api.useb.co.kr/sign-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_id: Number(process.env.KYC_CUSTOMER_ID ?? 0),
      username:
        type === "user"
          ? process.env.KYC_USERNAME
          : process.env.KYC_REVIEWER_USERNAME,
      password:
        type === "user"
          ? process.env.KYC_PASSWORD
          : process.env.KYC_REVIEWER_PASSWORD,
    }),
  });

  const { token } = await result.json();
  return token as string;
};
