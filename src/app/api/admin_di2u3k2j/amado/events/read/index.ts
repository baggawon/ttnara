import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import {
  MOCK_AMADO_EVENTS,
  type AmadoEvent,
} from "@/helpers/server/amado/mockEvents";
import { getAmadoEvents } from "@/helpers/server/amado/amadoApi";
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
  // True when this entry was reconstructed from an existing post whose source
  // event is no longer in the live Amado feed (resolved/hidden/removed
  // upstream). Surfaced so a created post never silently vanishes from the
  // manager — it stays visible/editable, just without a live deadline/volume.
  archived?: boolean;
}

export interface AmadoEventsReadResult {
  events: AmadoEventWithLocal[];
}

export const GET = async (queryParams: AmadoEventsReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    // Live fetch from the Amado API (cached ~1h in-process). Falls back to the
    // bundled sample list only on a cold-start failure so the admin page and
    // local dev still work when the upstream is unreachable.
    let events: AmadoEvent[];
    let liveOk = true;
    try {
      events = await getAmadoEvents();
    } catch {
      events = MOCK_AMADO_EVENTS;
      liveOk = false;
    }

    // Match each event to its local post so admins see which events are already
    // threads. The event↔post link lives durably in `thread.amado_event_id`, so
    // posts survive a cache refresh or an event leaving the live feed. Scoped to
    // the currently designated card-format home topic.
    const topic = await getSpecialTopic();

    let enriched: AmadoEventWithLocal[];
    const archived: AmadoEventWithLocal[] = [];

    if (topic) {
      // Pull every Amado-sourced post in the topic (not just ones in the live
      // feed) so we can enrich live events, recover posts whose source event
      // dropped off Amado, and reconcile the stored expiry fields.
      const localThreads =
        (await handleConnect((prisma) =>
          prisma.thread.findMany({
            where: { topic_id: topic.id, amado_event_id: { not: null } },
            select: {
              id: true,
              amado_event_id: true,
              created_at: true,
              is_featured: true,
              title: true,
              category: { select: { name: true } },
              amado_event_end_date: true,
              amado_event_removed: true,
            },
            orderBy: { created_at: "desc" },
          })
        )) ?? [];

      const topicUrl = topic.url;
      const stub = (t: (typeof localThreads)[number]): LocalPostStub => ({
        id: t.id,
        topic_url: topicUrl,
        created_at: t.created_at.toISOString(),
        is_featured: t.is_featured,
      });

      const localByEventId = new Map<string, (typeof localThreads)[number]>();
      for (const t of localThreads) {
        if (t.amado_event_id) localByEventId.set(t.amado_event_id, t);
      }

      const liveIds = new Set(events.map((e) => e.id));
      const liveMotById = new Map(events.map((e) => [e.id, e.moment_of_truth]));
      enriched = events.map((e) => {
        const t = localByEventId.get(e.id);
        return { ...e, local_post: t ? stub(t) : null };
      });

      // Recovery + reconciliation only make sense against a real feed. On the
      // rare cold-start fallback to mock we can't tell which events truly left
      // the feed, so we skip both rather than mislabel every post as expired.
      if (liveOk) {
        // Posts whose source event is gone from the live feed — reconstruct a
        // card from the thread (with its last-known deadline) so they stay in
        // the manager, flagged expired.
        for (const t of localThreads) {
          if (!t.amado_event_id || liveIds.has(t.amado_event_id)) continue;
          archived.push({
            id: t.amado_event_id,
            title: t.title,
            category: t.category?.name ?? "기타",
            moment_of_truth: t.amado_event_end_date
              ? t.amado_event_end_date.toISOString()
              : null,
            thumbnail_url: null,
            detail_url: `https://playamado.com/events/${t.amado_event_id}`,
            status: "resolved",
            volume_krw: null,
            local_post: stub(t),
            archived: true,
          });
        }

        // Persist expiry state so the user-end can render it without the feed:
        // refresh the deadline for live events, flip the removed flag for gone
        // ones. Best-effort — the response above is already correct regardless.
        const pending: {
          id: number;
          data: { amado_event_end_date?: Date; amado_event_removed?: boolean };
        }[] = [];
        for (const t of localThreads) {
          if (!t.amado_event_id) continue;
          const inFeed = liveIds.has(t.amado_event_id);
          const data: {
            amado_event_end_date?: Date;
            amado_event_removed?: boolean;
          } = {};
          if (t.amado_event_removed !== !inFeed) {
            data.amado_event_removed = !inFeed;
          }
          if (inFeed) {
            const mot = liveMotById.get(t.amado_event_id);
            const desired = mot ? new Date(mot) : null;
            if (
              desired &&
              (!t.amado_event_end_date ||
                t.amado_event_end_date.getTime() !== desired.getTime())
            ) {
              data.amado_event_end_date = desired;
            }
          }
          if (Object.keys(data).length > 0) pending.push({ id: t.id, data });
        }
        if (pending.length > 0) {
          try {
            await handleConnect((prisma) =>
              Promise.all(
                pending.map((p) =>
                  prisma.thread.update({ where: { id: p.id }, data: p.data })
                )
              )
            );
          } catch {
            // best-effort; stored flags catch up on the next admin view
          }
        }
      }
    } else {
      enriched = events.map((e) => ({ ...e, local_post: null }));
    }

    return {
      result: true,
      data: { events: [...enriched, ...archived] } as AmadoEventsReadResult,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
