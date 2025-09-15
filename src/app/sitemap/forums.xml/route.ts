import { NextResponse } from "next/server";
import { handleConnect } from "@/helpers/server/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

export async function GET() {
  console.log("[Forums Sitemap] Generating forums sitemap");
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.CLIENT_URL ||
      "https://ttnara.com";

    // Get all active topics
    console.log("[Forums Sitemap] Fetching topics");
    const topics = await handleConnect((prisma) =>
      prisma.topic.findMany({
        where: {
          is_active: true,
        },
        select: {
          url: true,
        },
        orderBy: {
          display_order: "asc",
        },
      })
    ).catch((error) => {
      console.error("[Forums Sitemap] Failed to fetch topics:", error);
      return [];
    });

    // Topic URLs
    const topicUrls = (topics ?? []).map((topic) => ({
      loc: `${baseUrl}/${topic.url}`,
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: "0.8",
    }));

    // Return in XML format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${topicUrls
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
    console.error("[Forums Sitemap] Generation failed:", error);
    return new NextResponse("Error generating forums sitemap", { status: 500 });
  }
}
