import { NextResponse } from "next/server";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

// Static URLs that don't change frequently
const staticUrls: MetadataRoute.Sitemap = [
  {
    url: process.env.CLIENT_URL || "https://ttnara.com",
    lastModified: new Date().toISOString(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${process.env.CLIENT_URL || "https://ttnara.com"}/board/tether`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily",
    priority: 0.8,
  },
];

export async function GET() {
  console.log("[Commons Sitemap] Generating commons sitemap");
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.CLIENT_URL ||
      "https://ttnara.com";

    // Convert static URLs to the format needed for XML
    const xmlUrls = staticUrls.map(
      ({ url, lastModified, changeFrequency, priority }) => ({
        loc: url,
        lastmod: lastModified,
        changefreq: changeFrequency?.toLowerCase() || "daily",
        priority: priority?.toString() || "1.0",
      })
    );

    // Return in XML format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${xmlUrls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
    )
    .join("")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Commons Sitemap] Generation failed:", error);
    return new NextResponse("Error generating commons sitemap", {
      status: 500,
    });
  }
}
