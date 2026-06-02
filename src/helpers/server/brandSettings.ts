import "server-only";
import { cache } from "react";
import { handleConnect } from "@/helpers/server/prisma";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";

export interface BrandSettings {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string[];
  logoImageUrl: string | null;
  faviconUrl: string | null;
  appleIconUrl: string | null;
  heroImageUrl: string | null;
  heroActionUrl: string | null;
}

// Neutral fallback used only when the DB row is missing (fresh deploy with no
// general_setting row). Intentionally avoids any tenant/brand-specific copy.
const DEFAULT_BRAND: BrandSettings = {
  siteName: "",
  siteTitle: "",
  siteDescription: "",
  siteKeywords: [],
  logoImageUrl: null,
  faviconUrl: null,
  appleIconUrl: null,
  heroImageUrl: null,
  heroActionUrl: null,
};

const parseKeywords = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
};

// React `cache()` dedupes within a single request — layout + generateMetadata
// share one DB read per page render. We deliberately skip the in-memory
// `appCache` here so admin saves are reflected on the very next request
// without depending on cross-module singleton state, which has been flaky
// across HMR/route-handler boundaries in dev.
export const getBrandSettings = cache(async (): Promise<BrandSettings> => {
  try {
    const row = await handleConnect((prisma) =>
      prisma.general_setting.findFirst({
        orderBy: { id: "asc" },
        select: {
          site_name: true,
          site_title: true,
          site_description: true,
          site_keywords: true,
          logo_image_url: true,
          favicon_url: true,
          apple_icon_url: true,
          hero_image_url: true,
          hero_action_url: true,
        },
      })
    );
    if (!row) return DEFAULT_BRAND;

    const siteName = row.site_name?.trim() || "";
    const faviconUrl = row.favicon_url
      ? signStoredCloudFrontUrl(row.favicon_url)
      : null;
    return {
      siteName,
      siteTitle: row.site_title?.trim() || siteName,
      siteDescription: row.site_description?.trim() || "",
      siteKeywords: parseKeywords(row.site_keywords),
      logoImageUrl: row.logo_image_url
        ? signStoredCloudFrontUrl(row.logo_image_url)
        : null,
      faviconUrl,
      appleIconUrl: row.apple_icon_url
        ? signStoredCloudFrontUrl(row.apple_icon_url)
        : faviconUrl,
      heroImageUrl: row.hero_image_url
        ? signStoredCloudFrontUrl(row.hero_image_url)
        : null,
      heroActionUrl: row.hero_action_url?.trim() || null,
    };
  } catch {
    return DEFAULT_BRAND;
  }
});

// Helper for per-page `generateMetadata` — appends the configured brand name
// as a title suffix. Falls back to the bare page title when no brand is set
// (fresh deploy) so we never render "랭킹 - " with a dangling dash.
export const buildPageTitle = async (pageTitle: string): Promise<string> => {
  const brand = await getBrandSettings();
  const suffix = brand.siteName.trim();
  if (!pageTitle) return suffix;
  return suffix ? `${pageTitle} - ${suffix}` : pageTitle;
};
