"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/helpers/chatStore";
import { useShallow } from "zustand/react/shallow";
import { useChatWebSocket } from "@/helpers/customHook/useChatWebSocket";
import { useChatSession } from "@/helpers/customHook/useChatSession";
import { ChatMessageItem } from "@/components/2_molecules/ChatMessage";
import { ChatSystemMessageItem } from "@/components/2_molecules/ChatSystemMessage";
import { ChatNoticeCarousel } from "@/components/2_molecules/ChatNoticeCarousel";
import { ChatBanner } from "@/components/2_molecules/ChatBanner";
import { ChatInput } from "@/components/2_molecules/ChatInput";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Pin, X, Settings, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from "clsx";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { sessionGet } from "@/helpers/get";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { postJson } from "@/helpers/common";
import { useToast } from "@/components/ui/use-toast";
import { ToastData } from "@/helpers/toastData";
import type { Session } from "next-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ChatWidgetImpl = () => {
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    { queryKey: [QueryKey.session] },
    sessionGet
  );

  // Subscribe to only the slices actually rendered here. Without this,
  // typing in the chat input rerenders every chat message in the list
  // (the input no longer lives here, but the widget would still rerender
  // on every store mutation).
  const {
    setOpen,
    topics,
    currentTopicId,
    setCurrentTopic,
    messages,
    systemMessages,
    fixedMessages,
    userCounts,
    isBanned,
    muteUntil,
    spamState,
    chatSettings,
    connected,
    hiddenUsers,
    unhideUser,
    clearHiddenUsers,
  } = useChatStore(
    useShallow((s) => ({
      setOpen: s.setOpen,
      topics: s.topics,
      currentTopicId: s.currentTopicId,
      setCurrentTopic: s.setCurrentTopic,
      messages: s.messages,
      systemMessages: s.systemMessages,
      fixedMessages: s.fixedMessages,
      userCounts: s.userCounts,
      isBanned: s.isBanned,
      muteUntil: s.muteUntil,
      spamState: s.spamState,
      chatSettings: s.chatSettings,
      connected: s.connected,
      hiddenUsers: s.hiddenUsers,
      unhideUser: s.unhideUser,
      clearHiddenUsers: s.clearHiddenUsers,
    }))
  );

  const uid = session?.user?.id ?? null;
  const userLevel = session?.user?.auth_level ?? 0;
  const isModerator = userLevel >= chatSettings.levelModerator;
  const canChat =
    !!session?.user && userLevel >= chatSettings.levelChat && !isBanned;
  const { toast } = useToast();

  // Pull config + JWT. Token is null when logged out — the widget is still
  // visible, just read-only.
  const { chatServerUrl, token } = useChatSession(!!session?.user);

  const { sendMessage, switchTopic } = useChatWebSocket(
    chatServerUrl,
    token,
    currentTopicId
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Mute modal
  const [muteTarget, setMuteTarget] = useState<string | null>(null);
  const [muteDuration, setMuteDuration] = useState("5");

  // Hidden-users management modal
  const [hiddenManagerOpen, setHiddenManagerOpen] = useState(false);

  // Auto-scroll the messages list to the bottom on new messages. Use the
  // inner container's scrollTop directly — `scrollIntoView` would propagate
  // the scroll up to ancestors and yank the whole page.
  const currentMessagesLength = messages[currentTopicId]?.length;
  const currentSystemMessagesLength = systemMessages[currentTopicId]?.length;
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [currentMessagesLength, currentSystemMessagesLength]);

  const handleTopicSwitch = useCallback(
    (topicId: number) => {
      setCurrentTopic(topicId);
      switchTopic(topicId);
    },
    [setCurrentTopic, switchTopic]
  );

  const handleReport = useCallback(
    async (messageId: string) => {
      if (!session?.user) return;
      const res = await postJson(ApiRoute.chatReport, {
        message_id: messageId,
      });
      toast({
        id: res?.isSuccess ? ToastData.chatReportSubmit : ToastData.unknown,
        type: res?.isSuccess ? "success" : "error",
      });
    },
    [session?.user, toast]
  );

  const handleMuteRequest = useCallback((targetUid: string) => {
    setMuteTarget(targetUid);
  }, []);

  const handleSetFixed = useCallback(
    async (topicId: number, content: string) => {
      const res = await postJson(ApiRoute.adminChatFixedMessagesUpdate, {
        topic_id: topicId,
        content,
        is_active: true,
      });
      toast({
        id: res?.isSuccess ? ToastData.chatFixedMessageSave : ToastData.unknown,
        type: res?.isSuccess ? "success" : "error",
      });
    },
    [toast]
  );

  const handleApplyMute = async () => {
    if (!muteTarget) return;
    const minutes = parseInt(muteDuration);
    if (!minutes || minutes < 1) {
      toast({ id: "유효한 시간을 입력하세요.", type: "error" });
      return;
    }
    const res = await postJson(ApiRoute.adminChatModerationMute, {
      uid: muteTarget,
      minutes,
    });
    toast({
      id: res?.isSuccess ? ToastData.chatModerationMute : ToastData.unknown,
      type: res?.isSuccess ? "success" : "error",
    });
    setMuteTarget(null);
  };

  // useMemo so the empty-array fallback doesn't churn the feed memo below.
  const currentMessages = useMemo(
    () => messages[currentTopicId] ?? [],
    [messages, currentTopicId]
  );
  const currentSystemMessages = useMemo(
    () => systemMessages[currentTopicId] ?? [],
    [systemMessages, currentTopicId]
  );
  const currentFixed = fixedMessages[currentTopicId];
  const currentUserCount = userCounts[currentTopicId] ?? 0;

  // Merge chat + system messages into a single chronological feed. System
  // messages are local-only (only this user sees them); broadcast messages
  // are shared. Both carry `created_at` so we can interleave by timestamp.
  type FeedItem =
    | {
        kind: "chat";
        created_at: string;
        data: (typeof currentMessages)[number];
      }
    | {
        kind: "system";
        created_at: string;
        data: (typeof currentSystemMessages)[number];
      };
  const feedItems = useMemo<FeedItem[]>(
    () =>
      [
        ...currentMessages.map<FeedItem>((m) => ({
          kind: "chat",
          created_at: m.created_at,
          data: m,
        })),
        ...currentSystemMessages.map<FeedItem>((m) => ({
          kind: "system",
          created_at: m.created_at,
          data: m,
        })),
      ].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [currentMessages, currentSystemMessages]
  );

  const topicScrollRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="flex flex-col w-full h-full lg:w-[280px] lg:h-[700px] border rounded-lg bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">실시간 채팅</span>
            {connected && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            )}
          </div>
          <div className="flex items-center gap-0.5 -mr-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="채팅 설정"
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem onClick={() => setHiddenManagerOpen(true)}>
                  <EyeOff className="w-3 h-3 mr-2" />
                  숨김 관리
                  {hiddenUsers.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] px-1.5"
                    >
                      {hiddenUsers.length}
                    </Badge>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="채팅 닫기"
              className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Carousel */}
        <ChatNoticeCarousel />

        {/* Topic Tabs */}
        {topics.length > 0 && (
          <div className="flex items-center border-b">
            <div
              ref={topicScrollRef}
              className="flex-1 flex overflow-x-auto scrollbar-hide"
            >
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleTopicSwitch(topic.id)}
                  className={clsx(
                    "px-3 py-1.5 text-xs whitespace-nowrap border-b-2 transition-colors shrink-0",
                    currentTopicId === topic.id
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {topic.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 px-2 text-[10px] text-muted-foreground shrink-0">
              <Users className="w-3 h-3" />
              <span>{currentUserCount}</span>
            </div>
          </div>
        )}

        {/* Banned overlay */}
        {isBanned ? (
          <div className="flex-1 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
            채팅 이용이 제한되었습니다.
          </div>
        ) : topics.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <MessageCircle className="w-8 h-8 opacity-40" />
            <p>아직 개설된 채팅 토픽이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* Fixed Message */}
            {currentFixed && (
              <ChatBanner
                accent="fixed"
                icon={<Pin className="w-3 h-3 rotate-45" />}
                content={currentFixed}
              />
            )}

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden"
            >
              {feedItems.map((item) =>
                item.kind === "chat" ? (
                  <ChatMessageItem
                    key={item.data.id}
                    message={item.data}
                    isModerator={isModerator}
                    currentUid={uid}
                    onReport={handleReport}
                    onMute={handleMuteRequest}
                    onSetFixed={handleSetFixed}
                  />
                ) : (
                  <ChatSystemMessageItem
                    key={item.data.id}
                    message={item.data}
                  />
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-2">
              {!session?.user ? (
                <div className="text-center text-xs text-muted-foreground py-1">
                  로그인 후 채팅에 참여할 수 있습니다.
                </div>
              ) : !canChat ? (
                <div className="text-center text-xs text-muted-foreground py-1">
                  채팅 권한이 없습니다.
                </div>
              ) : (
                <ChatInput
                  sendMessage={sendMessage}
                  maxLength={chatSettings.maxChatLength}
                />
              )}
              {muteUntil && Date.now() < muteUntil && (
                <div className="text-[10px] text-red-500 mt-1 text-center">
                  뮤트 상태입니다. (
                  {Math.ceil((muteUntil - Date.now()) / 60000)}분 남음)
                </div>
              )}
              {spamState.penaltyUntil &&
                Date.now() < spamState.penaltyUntil && (
                  <div className="text-[10px] text-red-500 mt-1 text-center">
                    도배 제한 중입니다. 잠시 후 다시 시도하세요.
                  </div>
                )}
            </div>
          </>
        )}
      </div>

      {/* Mute Dialog */}
      <Dialog
        open={!!muteTarget}
        onOpenChange={(open) => !open && setMuteTarget(null)}
      >
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>사용자 뮤트</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <label className="text-sm">
              뮤트 기간 (분)
              <input
                type="number"
                value={muteDuration}
                onChange={(e) => setMuteDuration(e.target.value)}
                min="1"
                max="1440"
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              />
            </label>
            <Button onClick={handleApplyMute}>뮤트 적용</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden users management */}
      <Dialog open={hiddenManagerOpen} onOpenChange={setHiddenManagerOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>숨김 관리</DialogTitle>
            <DialogDescription>
              숨긴 사용자의 메시지는 채팅에 표시되지 않습니다. 여기서 다시
              표시할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          {hiddenUsers.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              숨긴 사용자가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>총 {hiddenUsers.length}명</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (confirm("모든 숨김을 해제하시겠습니까?")) {
                      clearHiddenUsers();
                    }
                  }}
                >
                  전체 해제
                </Button>
              </div>
              <ul className="max-h-72 overflow-y-auto divide-y border rounded-md">
                {hiddenUsers.map((h) => (
                  <li
                    key={h.uid}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="truncate">{h.displayname}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 ml-2"
                      onClick={() => unhideUser(h.uid)}
                    >
                      해제
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ChatWidget = memo(ChatWidgetImpl);
