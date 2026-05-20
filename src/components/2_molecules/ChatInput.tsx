"use client";

import { useCallback, useState } from "react";
import { useChatStore } from "@/helpers/chatStore";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  sendMessage: (content: string) => void;
  maxLength: number;
}

export const ChatInput = ({ sendMessage, maxLength }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState("");

  // Reads happen at submit time via getState() so the input doesn't
  // resubscribe to chat state on every keystroke.
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;

    const {
      chatSettings,
      muteUntil,
      spamState,
      currentTopicId,
      pushSystemMessage,
    } = useChatStore.getState();

    const now = Date.now();

    // The spam interval is enforced server-side — we no longer pre-block fast
    // sends here, so the offence actually reaches the backend and is counted.
    // We still short-circuit on an active mute / penalty for instant feedback.
    if (muteUntil && now < muteUntil) {
      pushSystemMessage({
        topic_id: currentTopicId,
        kind: "muted",
        message: "뮤트 상태입니다.",
        until: muteUntil,
      });
      return;
    }

    if (spamState.penaltyUntil && now < spamState.penaltyUntil) {
      pushSystemMessage({
        topic_id: currentTopicId,
        kind: "spam_penalty",
        message: "도배 제한 중입니다.",
        until: spamState.penaltyUntil,
      });
      return;
    }

    if (text.length > chatSettings.maxChatLength) return;

    sendMessage(text);
    setInputValue("");
  }, [inputValue, sendMessage]);

  return (
    <div className="flex gap-1">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="메시지 입력..."
        maxLength={maxLength}
        className="flex-1 text-xs px-2 py-1.5 rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0"
        onClick={handleSend}
        disabled={!inputValue.trim()}
      >
        <Send className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};
