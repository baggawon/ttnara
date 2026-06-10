"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { postJson } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { ChatPublicConfig } from "@/app/api/chat/topics/route";
import type { ChatTokenResponse } from "@/app/api/chat/token/route";
import { useChatStore } from "@/helpers/chatStore";

interface ChatSessionResult {
  chatServerUrl: string;
  token: string | null;
  ready: boolean;
}

/**
 * Bundles the public chat config (topics + non-sensitive settings) with a
 * short-lived JWT for the WebSocket handshake. Refreshes the token a few
 * minutes before expiry so the chat_server never sees an expired credential.
 *
 * Pass `enabled = false` for logged-out users — config still loads, but no
 * token is requested.
 */
export const useChatSession = (enabled: boolean): ChatSessionResult => {
  // Subscribe only to currentTopicId; actions are stable Zustand functions
  // we can read on demand. Using bare `useChatStore()` here would re-render
  // every consumer of this hook (notably ChatWidget) on every store mutation
  // — including high-frequency WebSocket events like user_count.
  const currentTopicId = useChatStore((s) => s.currentTopicId);

  const configQuery = useQuery<ChatPublicConfig | null>({
    queryKey: [QueryKey.chatTopics],
    queryFn: async () => {
      const res = await fetch(ApiRoute.chatTopicsRead);
      if (!res.ok) return null;
      const json = await res.json();
      return (json?.data as ChatPublicConfig | undefined) ?? null;
    },
    // The chat_server polls config every 30 s anyway; matching that here keeps
    // the widget honest without hammering the API.
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  // Mirror config into the Zustand store so the existing widget code paths
  // (which read from the store) keep working.
  useEffect(() => {
    const cfg = configQuery.data;
    if (!cfg) return;
    const { setTopics, setChatSettings, setCurrentTopic } =
      useChatStore.getState();
    setTopics(cfg.topics);
    setChatSettings({
      maxChatLength: cfg.settings.max_chat_length,
      spamFrequencySeconds: cfg.settings.spam_frequency_seconds,
      levelChat: cfg.settings.level_chat,
      levelModerator: cfg.settings.level_moderator,
      rankSource: cfg.settings.rank_source,
    });
    if (
      (currentTopicId === 0 ||
        !cfg.topics.some((t) => t.id === currentTopicId)) &&
      cfg.topics.length > 0
    ) {
      setCurrentTopic(cfg.topics[0].id);
    }
  }, [configQuery.data, currentTopicId]);

  const tokenQuery = useQuery<ChatTokenResponse | null>({
    queryKey: ["chatToken"],
    enabled,
    queryFn: async () => {
      const res = await postJson<{}>(ApiRoute.chatTokenIssue, {});
      if (!res?.isSuccess) return null;
      return (res.hasData as ChatTokenResponse | undefined) ?? null;
    },
    // Refresh ~2 min before the 30 min expiry. We don't know the actual TTL
    // until the first response, so this default is fine for our standard
    // 30-min token; on edge cases we'll re-fetch slightly early.
    refetchInterval: (query) => {
      const exp = query.state.data?.expiresAt;
      if (!exp) return 25 * 60 * 1000;
      const msUntil = exp * 1000 - Date.now() - 2 * 60 * 1000;
      return Math.max(msUntil, 30_000);
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  return {
    chatServerUrl: configQuery.data?.chat_server_url ?? "",
    token: tokenQuery.data?.token ?? null,
    ready: !configQuery.isLoading && (!enabled || !tokenQuery.isLoading),
  };
};
