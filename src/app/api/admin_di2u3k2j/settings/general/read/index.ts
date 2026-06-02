import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";
import type { general_setting } from "@prisma/client";

export interface GeneralReadProps {}

// Raw *_url columns store the unsigned CloudFront URL; the signed variants
// are for in-form preview only (signatures expire and must never be persisted).
export type GeneralReadResult = general_setting & {
  logo_image_signed_url: string | null;
  favicon_signed_url: string | null;
  apple_icon_signed_url: string | null;
  hero_image_signed_url: string | null;
};

export const GET = async (queryParams: GeneralReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const generalSettings = await handleConnect((prisma) =>
      prisma.general_setting.findFirst({ orderBy: { id: "asc" } })
    );

    if (!generalSettings) throw ToastData.unknown;

    const data: GeneralReadResult = {
      ...generalSettings,
      logo_image_signed_url: generalSettings.logo_image_url
        ? signStoredCloudFrontUrl(generalSettings.logo_image_url)
        : null,
      favicon_signed_url: generalSettings.favicon_url
        ? signStoredCloudFrontUrl(generalSettings.favicon_url)
        : null,
      apple_icon_signed_url: generalSettings.apple_icon_url
        ? signStoredCloudFrontUrl(generalSettings.apple_icon_url)
        : null,
      hero_image_signed_url: generalSettings.hero_image_url
        ? signStoredCloudFrontUrl(generalSettings.hero_image_url)
        : null,
    };

    return {
      result: true,
      data,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
