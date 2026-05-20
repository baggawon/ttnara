import type { MetadataRoute } from "next";
import { getBrandSettings } from "@/helpers/server/brandSettings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrandSettings();
  const name = brand.siteName || brand.siteTitle || "";

  // Icons: prefer the admin-uploaded apple/favicon (PNG-friendly). Without
  // explicit sizes the browser will still install the PWA — it just can't
  // pick an ideal raster, which is an acceptable trade for not maintaining
  // brand-specific static icon files.
  const brandIcon = brand.appleIconUrl ?? brand.faviconUrl;
  const icons: MetadataRoute.Manifest["icons"] = brandIcon
    ? [{ src: brandIcon, sizes: "any", type: "image/png", purpose: "any" }]
    : [];

  return {
    name,
    short_name: name,
    description: brand.siteDescription || name,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons,
  };
}
