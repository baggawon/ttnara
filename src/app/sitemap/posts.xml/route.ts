import { NextResponse } from "next/server";
import { handleConnect } from "@/helpers/server/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

export async function GET() {
  console.log("[Posts Sitemap] Generating posts sitemap");
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.CLIENT_URL ||
      "https://ttnara.com";

    // Get threads
    console.log("[Posts Sitemap] Fetching threads");
    const threads = await handleConnect((prisma) =>
      prisma.thread.findMany({
        where: {
          is_blocked: false,
          is_secret: false,
        },
        select: {
          id: true,
          updated_at: true,
          topic: {
            select: {
              url: true,
            },
          },
        },
        orderBy: {
          updated_at: "desc",
        },
        take: 50000,
      })
    ).catch((error) => {
      console.error("[Posts Sitemap] Failed to fetch threads:", error);
      return [];
    });

    // Thread URLs
    const threadUrls = (threads ?? []).map((thread, index) => ({
      loc: `${baseUrl}/${thread.topic.url}/${thread.id}`,
      lastmod: new Date(thread.updated_at).toISOString(),
      changefreq: index < 100 ? "daily" : "weekly",
      priority: Math.max(0.5, 0.9 - index * 0.001).toString(),
    }));

    // Return in XML format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${threadUrls
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
    console.error("[Posts Sitemap] Generation failed:", error);
    return new NextResponse("Error generating posts sitemap", { status: 500 });
  }
}
