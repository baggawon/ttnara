import { type profile, type user, type kyc } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";

export interface UserForAdmin extends user {
  profile: profile | null;
  kyc: kyc[];
}

async function getUser(queryParams: any): Promise<UserForAdmin> {
  const user_id = queryParams.user_id;
  try {
    const user = await handleConnect((prisma) =>
      prisma.user.findUnique({
        where: {
          id: user_id,
        },
        include: {
          profile: true,
          kyc: true,
        },
      })
    );
    if (!user) throw ToastData.adminUserRead;
    return user;
  } catch (error) {
    throw ToastData.unknown;
    // throw {
    //   id: ToastData.apiHandleError,
    //   type: "error",
    //   value: `getUser: ${error}`,
    // };
  }
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getUser(queryParams);
    return {
      result: true,
      data: response,
    };
    //   } catch (error: any) {
  } catch (error) {
    return {
      result: false,
      message: String(error),
      //   message: error?.id ? error : String(error),
    };
  }
}
