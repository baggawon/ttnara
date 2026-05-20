import { handleConnect } from "@/helpers/server/prisma";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { getSignedCloudFrontUrl } from "@/helpers/server/s3";

export interface GuaranteeBannerResponse {
  public_hero_image_url: string | null;
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const setting = await handleConnect((prisma) =>
      prisma.guarantee_page_setting.findUnique({ where: { id: 1 } })
    );

    const public_hero_image_url = setting?.public_hero_image_url
      ? getSignedCloudFrontUrl(setting.public_hero_image_url)
      : null;

    return {
      result: true,
      data: { public_hero_image_url } as GuaranteeBannerResponse,
    };
  } catch (error) {
    return { result: false, message: String(error) };
  }
}
