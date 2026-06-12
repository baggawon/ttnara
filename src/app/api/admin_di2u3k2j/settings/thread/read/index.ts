import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";

export interface ThreadGenaralSettingsReadProps {}

export const GET = async (queryParams: ThreadGenaralSettingsReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const threadGeneralSettings = await handleConnect((prisma) =>
      prisma.thread_setting.findFirst({ orderBy: { id: "asc" } })
    );

    if (!threadGeneralSettings) throw ToastData.unknown;

    // Sign the stored (unsigned) image URLs so the admin form can preview
    // them. The update endpoint strips the signatures before persisting.
    const data = {
      ...threadGeneralSettings,
      default_thumbnail_url: threadGeneralSettings.default_thumbnail_url
        ? signStoredCloudFrontUrl(threadGeneralSettings.default_thumbnail_url)
        : threadGeneralSettings.default_thumbnail_url,
      admin_badge_image_url: threadGeneralSettings.admin_badge_image_url
        ? signStoredCloudFrontUrl(threadGeneralSettings.admin_badge_image_url)
        : threadGeneralSettings.admin_badge_image_url,
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
