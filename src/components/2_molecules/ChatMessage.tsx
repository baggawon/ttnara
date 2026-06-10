"use client";

import { memo } from "react";
import type { ChatMessage as ChatMessageType } from "@/helpers/chatStore";
import { useChatStore } from "@/helpers/chatStore";
import { RankBadge } from "@/components/1_atoms/rank/RankBadge";
import dayjs from "dayjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Flag, EyeOff, Volume, VolumeX, Pin } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  isModerator: boolean;
  currentUid: string | null;
  onReport: (messageId: string) => void;
  onMute: (uid: string) => void;
  onSetFixed: (topicId: number, content: string) => void;
}

const ChatMessageItemImpl = ({
  message,
  isModerator,
  currentUid,
  onReport,
  onMute,
  onSetFixed,
}: ChatMessageProps) => {
  // Targeted selectors so this row only re-renders when its hidden state
  // (or actions, which are stable) changes — not on every chat tick.
  const isHiddenUser = useChatStore((s) =>
    s.hiddenUsers.some((h) => h.uid === message.uid)
  );
  const hideUser = useChatStore((s) => s.hideUser);
  const unhideUser = useChatStore((s) => s.unhideUser);
  const rankSource = useChatStore((s) => s.chatSettings.rankSource);

  if (isHiddenUser) return null;
  if (message.is_hidden) return null;

  const isOwnMessage = currentUid === message.uid;
  const time = dayjs(message.created_at).format("HH:mm");

  // Per-item gates. Pinning works on own messages too (admin pinning their
  // own announcement is a normal flow); the rest only target other users.
  const showReportHide = !!currentUid && !isOwnMessage;
  const showMute = isModerator && !isOwnMessage;
  const showSetFixed = isModerator;
  const hasMenu = showReportHide || showMute || showSetFixed;

  return (
    <div className="flex items-start gap-1.5 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 group text-xs">
      {rankSource !== "none" && (
        <RankBadge
          badgeName={message.rank_image ?? "bronze.png"}
          className="!w-4 !h-4 shrink-0 mt-0.5"
        />
      )}
      <div className="flex-1 min-w-0 [overflow-wrap:anywhere]">
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="font-semibold text-primary hover:underline cursor-pointer"
                type="button"
              >
                {message.displayname}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              {showReportHide && (
                <>
                  <DropdownMenuItem onClick={() => onReport(message.id)}>
                    <Flag className="w-3 h-3 mr-2" />
                    신고
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      isHiddenUser
                        ? unhideUser(message.uid)
                        : hideUser(message.uid, message.displayname)
                    }
                  >
                    <EyeOff className="w-3 h-3 mr-2" />
                    {isHiddenUser ? "숨김 해제" : "이 유저 숨기기"}
                  </DropdownMenuItem>
                </>
              )}
              {showMute && (
                <DropdownMenuItem onClick={() => onMute(message.uid)}>
                  <VolumeX className="w-3 h-3 mr-2" />
                  뮤트
                </DropdownMenuItem>
              )}
              {showSetFixed && (
                <DropdownMenuItem
                  onClick={() => onSetFixed(message.topic_id, message.content)}
                >
                  <Pin className="w-3 h-3 mr-2 rotate-45" />
                  고정 메시지로 설정
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="font-semibold text-primary">
            {message.displayname}
          </span>
        )}
        <span className="text-muted-foreground ml-1">{message.content}</span>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {time}
      </span>
    </div>
  );
};

export const ChatMessageItem = memo(ChatMessageItemImpl);
