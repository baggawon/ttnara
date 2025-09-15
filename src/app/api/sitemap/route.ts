import { handleConnect } from "@/helpers/server/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("[Sitemap API] Starting sitemap data fetch");
  try {
    // Get all active topics
    console.log("[Sitemap API] Fetching topics");
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
      console.error("[Sitemap API] Failed to fetch topics:", error);
      console.error("[Sitemap API] Error stack:", (error as Error).stack);
      return [];
    });

    console.log(`[Sitemap API] Found ${topics?.length ?? 0} topics`);

    // Get total count of threads
    console.log("[Sitemap API] Counting threads");
    const totalThreads =
      (await handleConnect((prisma) =>
        prisma.thread.count({
          where: {
            is_blocked: false,
            is_secret: false,
          },
        })
      ).catch((error) => {
        console.error("[Sitemap API] Failed to count threads:", error);
        console.error("[Sitemap API] Error stack:", (error as Error).stack);
        return 0;
      })) || 0;

    console.log(`[Sitemap API] Total thread count: ${totalThreads}`);

    // Get all threads with pagination
    console.log("[Sitemap API] Fetching threads");
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
        take: Math.min(totalThreads || 0, 50000),
      })
    ).catch((error) => {
      console.error("[Sitemap API] Failed to fetch threads:", error);
      console.error("[Sitemap API] Error stack:", (error as Error).stack);
      return [];
    });

    console.log(`[Sitemap API] Fetched ${threads?.length ?? 0} threads`);

    return NextResponse.json({
      data: {
        topics,
        threads,
      },
    });
  } catch (error) {
    console.error("[Sitemap API] Fatal error:", error);
    console.error("[Sitemap API] Error stack:", (error as Error).stack);
    return NextResponse.json(
      { error: "Failed to generate sitemap data" },
      { status: 500 }
    );
  }
}
