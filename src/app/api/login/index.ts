import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import bcrypt from "bcrypt";
import { checkUserStatus } from "@/helpers/server/serverFunctions";

export interface LoginProps {
  username: string;
  password: string;
}

export const POST = async (json: LoginProps) => {
  try {
    const { username, password }: LoginProps = json;
    const isAblePropsToSignup = username && password;
    // console.log(await bcrypt.hash(password, 10));

    if (!isAblePropsToSignup) throw ToastData.unknown;

    const user = await handleConnect((prisma) =>
      prisma.user.findUnique({
        where: {
          username,
        },
        include: {
          profile: {
            select: {
              phone_number: true,
              displayname: true,
              auth_level: true,
              phone_is_validated: true,
            },
          },
        },
      })
    );

    if (!user) throw ToastData.login;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw ToastData.login;

    const error = checkUserStatus(user);
    if (error) throw error;

    return {
      result: true,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
