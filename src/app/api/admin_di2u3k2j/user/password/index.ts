import bcrypt from "bcrypt";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { validatePassword } from "@/helpers/validate";
import { ToastData } from "@/helpers/toastData";

export interface adminUserPasswordProps {
  id: string;
  password: string;
}

export const POST = async (json: adminUserPasswordProps) => {
  try {
    if (!json || typeof json.id !== "string" || json.id === "") {
      throw new Error("Invalid or missing user ID");
    }

    await requestValidator([RequestValidator.Admin], json);

    // A missing/blank field must never become the user's password.
    // validatePassword returns ValidatePassword.empty for blank, and the
    // length rule otherwise — reject anything that doesn't pass.
    const password = typeof json.password === "string" ? json.password : "";
    const passwordError = validatePassword(password);
    if (passwordError) {
      throw new Error(passwordError);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updated = await handleConnect((prisma) =>
      prisma.user.update({
        where: { id: json.id },
        data: { password: hashedPassword },
        select: { id: true },
      })
    );

    if (!updated) {
      throw new Error("Database update failed");
    }

    return {
      result: true,
      message: ToastData.passwordUpdate,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
