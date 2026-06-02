import type { guarantee_company } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  getSignedCloudFrontUrl,
  signCloudFrontUrlsInHtml,
} from "@/helpers/server/s3";

export interface PublicGuaranteeItem
  extends Omit<guarantee_company, "image_url" | "hero_image_url"> {
  public_image_url: string;
}

export interface PublicGuaranteeRegion {
  name: string;
  display_order: number;
}

export interface PublicGuaranteeResponse {
  public_hero_image_url: string | null;
  items: PublicGuaranteeItem[];
  regions: PublicGuaranteeRegion[];
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
        prisma.guarantee_region.findMany({
          where: { is_active: true },
          orderBy: [{ display_order: "asc" }, { id: "asc" }],
          select: { name: true, display_order: true },
        }),
      ])
    );

    // handleConnect swallows DB errors and returns undefined. On the success
    // path Promise.all always resolves to a truthy 3-tuple (even when tables are
    // empty), so a falsy `result` uniquely signals a swallowed error — surface
    // it as a failure instead of masquerading as "no companies".
    if (!result) {
      return { result: false, message: "보증업체 정보를 불러올 수 없습니다." };
    }

    const [rows, setting, regions] = result;

    const items = rows.map((item) => ({
      ...item,
      public_image_url: item.public_image_url
        ? getSignedCloudFrontUrl(item.public_image_url)
        : "",
      // Sign any CloudFront images embedded in the rich-text description.
      description: item.description
        ? signCloudFrontUrlsInHtml(item.description)
        : item.description,
    }));

    const public_hero_image_url = setting?.public_hero_image_url
      ? getSignedCloudFrontUrl(setting.public_hero_image_url)
      : null;

    return {
      result: true,
      data: {
        public_hero_image_url,
        items,
        regions,
      } as PublicGuaranteeResponse,
    };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
