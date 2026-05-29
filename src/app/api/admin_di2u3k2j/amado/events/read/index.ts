import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import {
  MOCK_AMADO_EVENTS,
  type AmadoEvent,
} from "@/helpers/server/amado/mockEvents";
import { handleConnect } from "@/helpers/server/prisma";
import { getSpecialTopic } from "@/helpers/server/specialBoard";

export interface AmadoEventsReadProps {}

// One existing post per event (the schema enforces this with a per-topic
// unique on amado_event_id). `null` means the event hasn't been turned into a
// post yet — the canonical "todo" signal for admins.
export interface LocalPostStub {
  id: number;
  topic_url: string;
  created_at: string;
  is_featured: boolean;
}

export interface AmadoEventWithLocal extends AmadoEvent {
  local_post: LocalPostStub | null;
}

export interface AmadoEventsReadResult {
  events: AmadoEventWithLocal[];
}

export const GET = async (queryParams: AmadoEventsReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    // Currently returns the static mock list. Swap to a network fetch when
    // the real Amado API lands — the response shape is the contract.
    const events = MOCK_AMADO_EVENTS;

    // Match each event to its local post (if any) so admins see at a glance
    // which events have already been turned into a thread. Scoped to the
    // currently designated card-format home topic.
    const topic = await getSpecialTopic();
    const localByEventId = new Map<string, LocalPostStub>();

    if (topic && events.length > 0) {
      const eventIds = events.map((e) => e.id);
      const localThreads = await handleConnect((prisma) =>
        prisma.thread.findMany({
          where: {
            topic_id: topic.id,
            amado_event_id: { in: eventIds },
          },
          select: {
            id: true,
            amado_event_id: true,
            created_at: true,
            is_featured: true,
          },
        })
      );
      for (const t of localThreads ?? []) {
        if (!t.amado_event_id) continue;
        localByEventId.set(t.amado_event_id, {
          id: t.id,
          topic_url: topic.url,
          created_at: t.created_at.toISOString(),
          is_featured: t.is_featured,
        });
      }
    }

    const enriched: AmadoEventWithLocal[] = events.map((e) => ({
      ...e,
      local_post: localByEventId.get(e.id) ?? null,
    }));

    return {
      result: true,
      data: { events: enriched } as AmadoEventsReadResult,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
