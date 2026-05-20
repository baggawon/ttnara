"use client";

import { useCallback, useEffect, useRef } from "react";
import { useChatStore, type ChatMessage } from "@/helpers/chatStore";

interface ChatServerMessage {
  type: string;
  payload: any;
}

export const useChatWebSocket = (
  serverUrl: string,
  token: string | null,
  topicId: number
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectAttempts = useRef(0);

  const handleError = useCallback(
    (payload: { code: string; message: string; until?: string }) => {
      // Read freshly from the store so the handler stays referentially stable
      // across topic / settings changes — otherwise the WebSocket reconnects
      // every time these change.
      const {
        currentTopicId,
        pushSystemMessage,
        recordSpamOffence,
        setBanned,
      } = useChatStore.getState();

      // Server may pass `until` (RFC3339) for time-bound errors so we don't
      // have to recompute it from chat settings — prefer it when present.
      const serverUntil = payload.until
        ? new Date(payload.until).getTime()
        : null;

      switch (payload.code) {
        case "SPAM_WARNING":
          pushSystemMessage({
            topic_id: currentTopicId,
            kind: "spam_warning",
            message:
              "메시지를 너무 자주 보내고 있습니다. 잠시 후 다시 시도해 주세요.",
            until: null,
          });
          break;
        case "SPAM_PENALTY_1":
        case "SPAM_PENALTY_2":
        case "SPAM_PENALTY_3": {
          // The server is authoritative on penalty duration and always sends
          // `until` for these — no client-side fallback computation needed.
          const until = serverUntil ?? Date.now();
          recordSpamOffence(until);
          pushSystemMessage({
            topic_id: currentTopicId,
            kind: "spam_penalty",
            message: "도배 제한이 적용되었습니다.",
            until,
          });
          break;
        }
        case "BANNED_WORD":
          pushSystemMessage({
            topic_id: currentTopicId,
            kind: "banned_word",
            message: "메시지에 금지어가 포함되어 있습니다.",
            until: null,
          });
          break;
        case "MUTED":
          pushSystemMessage({
            topic_id: currentTopicId,
            kind: "muted",
            message: "뮤트 상태입니다.",
            until: serverUntil,
          });
          break;
        case "BANNED":
          setBanned(true);
          break;
      }
    },
    []
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: ChatServerMessage = JSON.parse(event.data);
        const {
          addMessage,
          setMessages,
          hideMessage,
          setFixedMessage,
          removeFixedMessage,
          setUserCount,
          setMuteUntil,
          setBanned,
          setNotices,
          pushSystemMessage,
          currentTopicId,
        } = useChatStore.getState();

        switch (data.type) {
          case "message": {
            const msg = data.payload as ChatMessage;
            addMessage(msg);
            break;
          }
          case "messages_init": {
            const { topic_id, messages } = data.payload as {
              topic_id: number;
              messages: ChatMessage[];
            };
            setMessages(topic_id, messages);
            break;
          }
          case "message_hidden": {
            hideMessage(data.payload.message_id);
            break;
          }
          case "message_fixed": {
            setFixedMessage(data.payload.topic_id, data.payload.content);
            break;
          }
          case "message_fixed_removed": {
            removeFixedMessage(data.payload.topic_id);
            break;
          }
          case "user_muted": {
            if (data.payload.is_self) {
              const until = new Date(data.payload.until).getTime();
              setMuteUntil(until);
              pushSystemMessage({
                topic_id: currentTopicId,
                kind: "muted",
                message: "뮤트 상태입니다.",
                until,
              });
            }
            break;
          }
          case "user_unmuted": {
            if (data.payload.is_self) {
              setMuteUntil(null);
            }
            break;
          }
          case "user_banned": {
            if (data.payload.is_self) {
              setBanned(true);
            }
            break;
          }
          case "user_unbanned": {
            if (data.payload.is_self) {
              setBanned(false);
            }
            break;
          }
          case "user_count": {
            setUserCount(data.payload.topic_id, data.payload.count);
            break;
          }
          case "notice_update": {
            setNotices(data.payload.notices);
            break;
          }
          case "error": {
            handleError(data.payload);
            break;
          }
        }
      } catch (err) {
        console.error("Chat message parse error:", err);
      }
    },
    [handleError]
  );

  const connect = useCallback(() => {
    if (!serverUrl || !topicId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = new URL(serverUrl);
    if (token) url.searchParams.set("token", token);
    url.searchParams.set("topic_id", String(topicId));

    const ws = new WebSocket(url.toString());

    ws.onopen = () => {
      useChatStore.getState().setConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      useChatStore.getState().setConnected(false);
      // Auto-reconnect with exponential backoff (max 30s)
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttempts.current),
        30000
      );
      reconnectTimerRef.current = setTimeout(() => {
        reconnectAttempts.current++;
        connect();
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [serverUrl, token, topicId, handleMessage]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    useChatStore.getState().setConnected(false);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(
        JSON.stringify({
          type: "send_message",
          payload: { topic_id: topicId, content },
        })
      );
    },
    [topicId]
  );

  const switchTopic = useCallback((newTopicId: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: "switch_topic",
        payload: { topic_id: newTopicId },
      })
    );
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    sendMessage,
    switchTopic,
    disconnect,
    reconnect: connect,
  };
};
