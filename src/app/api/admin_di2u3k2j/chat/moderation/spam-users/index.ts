import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { fetchChatSpamState } from "@/helpers/server/chatServer";

/**
 * Lists users the chat_server's SpamTracker currently holds state for
 * (active 도배 penalty and/or remembered offence count). Spam state is
 * in-memory on the chat_server only, so when it's unreachable we report
 * `available: false` rather than pretending the list is empty.
 */
export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const users = await fetchChatSpamState();
    if (users === null) {
      return { result: true, data: { available: false, users: [] } };
    }
    if (users.length === 0) {
      return { result: true, data: { available: true, users: [] } };
    }

    // Hydrate displayname for the admin table.
    const profiles = await handleConnect((prisma) =>
      prisma.profile.findMany({
        where: { uid: { in: users.map((u) => u.uid) } },
        select: { uid: true, displayname: true },
      })
    );
    const byUid = new Map<string, string>();
    for (const p of profiles ?? []) byUid.set(p.uid, p.displayname);

    const data = users.map((u) => ({
      ...u,
      displayname: byUid.get(u.uid) ?? null,
    }));

    return { result: true, data: { available: true, users: data } };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
