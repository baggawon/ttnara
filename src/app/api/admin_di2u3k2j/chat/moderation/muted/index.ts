import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const muted = await handleConnect((prisma) =>
      prisma.chat_muted_user.findMany({
        orderBy: { until: "desc" },
      })
    );

    if (!muted || muted.length === 0) {
      return { result: true, data: [] };
    }

    // Hydrate displayname for the admin table.
    const profiles = await handleConnect((prisma) =>
      prisma.profile.findMany({
        where: { uid: { in: muted.map((m) => m.uid) } },
        select: { uid: true, displayname: true },
      })
    );
    const byUid = new Map<string, string>();
    for (const p of profiles ?? []) byUid.set(p.uid, p.displayname);

    const data = muted.map((m) => ({
      ...m,
      displayname: byUid.get(m.uid) ?? null,
      is_active: m.until > new Date(),
    }));

    return { result: true, data };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
