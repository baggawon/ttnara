import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

export async function GET() {
  console.log("[Sitemap Index] Generating sitemap index");
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.CLIENT_URL ||
      "https://ttnara.com";

    // Create the sitemap index XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap/commons.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/forums.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/posts.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Sitemap Index] Generation failed:", error);
    return new NextResponse("Error generating sitemap index", { status: 500 });
  }
}
