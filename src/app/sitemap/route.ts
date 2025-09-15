import { NextResponse } from "next/server";
import { handleConnect } from "@/helpers/server/prisma";
import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

// Import static URLs from the sitemap.ts file
const staticUrls = [
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
  console.log("[Sitemap XML] Starting data fetch");
  try {
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.CLIENT_URL ||
      "https://ttnara.com";

    // Convert static URLs to the format needed for XML
    const staticXmlUrls = staticUrls.map(
      ({ url, lastModified, changeFrequency, priority }) => ({
        loc: url,
        lastmod: lastModified,
        changefreq: changeFrequency?.toLowerCase() || "daily",
        priority: priority?.toString() || "1.0",
      })
    );

    // Get all active topics
    console.log("[Sitemap XML] Fetching topics");
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
      console.error("[Sitemap XML] Failed to fetch topics:", error);
      return [];
    });

    // Get threads
    console.log("[Sitemap XML] Fetching threads");
    const threads = await handleConnect((prisma) =>
      prisma.thread.findMany({
        where: {
          is_blocked: false,
          is_secret: false,
        },
        select: {
          id: true,
          topic: {
            select: {
              url: true,
            },
          },
          updated_at: true,
        },
        orderBy: {
          updated_at: "desc",
        },
        take: 50000,
      })
    ).catch((error) => {
      console.error("[Sitemap XML] Failed to fetch threads:", error);
      return [];
    });

    // Generate dynamic URLs
    const dynamicUrls = [
      // Topic URLs
      ...(topics ?? []).map((topic) => ({
        loc: `${baseUrl}/${topic.url}`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: "0.8",
      })),
      // Thread URLs
      ...(threads ?? []).map((thread, index) => ({
        loc: `${baseUrl}/${thread.topic.url}/${thread.id}`,
        lastmod: new Date(thread.updated_at).toISOString(),
        changefreq: index < 100 ? "daily" : "weekly",
        priority: Math.max(0.5, 0.9 - index * 0.001).toString(),
      })),
    ];

    // Combine static and dynamic URLs
    const allUrls = [...staticXmlUrls, ...dynamicUrls];

    // Return in XML format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
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
    console.error("[Sitemap XML] Generation failed:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
