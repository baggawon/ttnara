import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { profile, user } from "@prisma/client";
import { removeColumnsFromObject } from "@/helpers/basic";
import { updateUserRank } from "@/helpers/server/rankEvaluator";

export interface userUpdateProps
  extends Pick<user, "id" | "is_active" | "username" | "trade_count"> {
  profile: userUpdateProfileProps;
}

export type userUpdateProfileProps = Pick<
  profile,
  | "displayname"
  | "point"
  | "user_level"
  | "auth_level"
  | "is_app_admin"
  | "email"
  | "has_warranty"
  | "warranty_deposit_amount"
>;

export const POST = async (json: userUpdateProps) => {
  try {
    // Validate required fields
    if (!json) {
      throw new Error("No data provided");
    }

    if (typeof json?.id !== "string" || json?.id === "") {
      throw new Error("Invalid or missing user ID");
    }

    if (!json.profile) {
      throw new Error("Profile data is required");
    }

    // Validate numeric fields
    const numericFields = {
      trade_count: json.trade_count,
      "profile.user_level": json.profile.user_level,
      "profile.auth_level": json.profile.auth_level,
      "profile.point": json.profile.point,
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (typeof value !== "number" || isNaN(value)) {
        throw new Error(`Invalid numeric value for ${field}: ${value}`);
      }
    }

    await requestValidator([RequestValidator.Admin], json);

    // Check if displayname already exists (if being updated)
    if (json.profile.displayname) {
      const existingProfile = await handleConnect((prisma) =>
        prisma.profile.findFirst({
          where: {
            displayname: json.profile.displayname,
            user: {
              id: {
                not: json.id, // Exclude current user
              },
            },
          },
        })
      );

      if (existingProfile) {
        throw new Error("닉네임이 이미 사용중입니다");
      }
    }

    const updateResult = await handleConnect(async (prisma) => {
      // Use transaction to ensure both operations succeed or fail together
      return await prisma.$transaction(async (tx) => {
        // Update user and profile
        const updatedUser = await tx.user.update({
          where: {
            id: json.id,
          },
          data: {
            ...removeColumnsFromObject(json, [
              "profile",
              "created_at",
              "updated_at",
            ]),
            profile: { update: json.profile },
          },
        });

        // If trade_count was updated, evaluate and update rank
        if (typeof json.trade_count === "number") {
          await updateUserRank(tx, json.id, json.trade_count);
        }

        return updatedUser;
      });
    });

    if (!updateResult) {
      throw new Error("Database update failed");
    }

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
