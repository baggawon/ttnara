import type { guarantee_company } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import { getSignedCloudFrontUrl } from "@/helpers/server/s3";

export interface PublicGuaranteeItem
  extends Omit<guarantee_company, "image_url" | "hero_image_url"> {
  public_image_url: string;
}

export interface PublicGuaranteeResponse {
  public_hero_image_url: string | null;
  items: PublicGuaranteeItem[];
}

export const GET = async () => {
  try {
    const result = await handleConnect((prisma) =>
      Promise.all([
        prisma.guarantee_company.findMany({
          where: { is_active: true },
          orderBy: [{ display_order: "asc" }, { created_at: "desc" }],
        }),
        prisma.guarantee_page_setting.findUnique({ where: { id: 1 } }),
      ])
    );

    if (!result) {
      return { result: true, data: { public_hero_image_url: null, items: [] } };
    }

    const [rows, setting] = result;

    const items = rows.map((item) => ({
      ...item,
      public_image_url: item.public_image_url
        ? getSignedCloudFrontUrl(item.public_image_url)
        : "",
    }));

    const public_hero_image_url = setting?.public_hero_image_url
      ? getSignedCloudFrontUrl(setting.public_hero_image_url)
      : null;

    return {
      result: true,
      data: { public_hero_image_url, items } as PublicGuaranteeResponse,
    };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
