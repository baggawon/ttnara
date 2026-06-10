import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  uid: string;
  displayname: string;
  rank_level: number;
  rank_image: string | null;
  content: string;
  topic_id: number;
  created_at: string;
  is_hidden?: boolean;
}

export interface ChatNotice {
  id: number;
  title: string;
  content: string;
  display_order: number;
}

export interface ChatTopic {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface HiddenUser {
  uid: string;
  displayname: string;
}

export type ChatSystemMessageKind =
  | "banned_word"
  | "spam_warning"
  | "spam_penalty"
  | "muted";

// Local-only feedback shown to the offending user (banned word hits, spam
// throttling, mute). Never broadcast — pushed by `useChatWebSocket` from
// `error` / `user_muted` frames.
export interface ChatSystemMessage {
  id: string;
  topic_id: number;
  kind: ChatSystemMessageKind;
  message: string;
  until: number | null;
  created_at: string;
}

interface SpamState {
  offenceCount: number;
  penaltyUntil: number | null; // timestamp
}

interface ChatState {
  // Connection
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // Topics
  topics: ChatTopic[];
  currentTopicId: number;
  setTopics: (topics: ChatTopic[]) => void;
  setCurrentTopic: (topicId: number) => void;

  // Messages per topic
  messages: Record<number, ChatMessage[]>;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (topicId: number, msgs: ChatMessage[]) => void;
  hideMessage: (messageId: string) => void;
  maxDisplayItems: number;
  setMaxDisplayItems: (n: number) => void;

  // Per-user system messages (banned-word / spam / mute feedback). Local
  // only; never persisted or broadcast.
  systemMessages: Record<number, ChatSystemMessage[]>;
  pushSystemMessage: (
    msg: Omit<ChatSystemMessage, "id" | "created_at">
  ) => void;

  // Fixed messages per topic
  fixedMessages: Record<number, string>;
  setFixedMessage: (topicId: number, content: string) => void;
  removeFixedMessage: (topicId: number) => void;

  // User counts per topic
  userCounts: Record<number, number>;
  setUserCount: (topicId: number, count: number) => void;

  // Notices (carousel)
  notices: ChatNotice[];
  setNotices: (notices: ChatNotice[]) => void;

  // User-level state
  isBanned: boolean;
  setBanned: (banned: boolean) => void;
  muteUntil: number | null; // timestamp
  setMuteUntil: (until: number | null) => void;

  // Spam tracking (client-side)
  spamState: SpamState;
  recordSpamOffence: (penaltyUntil: number) => void;
  resetSpamState: () => void;

  // Hidden users (per-user preference, persisted). Tracks displayname so the
  // management UI can show something readable instead of raw cuids.
  hiddenUsers: HiddenUser[];
  hideUser: (uid: string, displayname: string) => void;
  unhideUser: (uid: string) => void;
  clearHiddenUsers: () => void;

  // Chat settings
  chatSettings: {
    maxChatLength: number;
    spamFrequencySeconds: number;
    levelChat: number;
    levelModerator: number;
    rankSource: "trade" | "board" | "none";
  };
  setChatSettings: (settings: ChatState["chatSettings"]) => void;

  // Chat open/collapsed state
  isOpen: boolean;
  toggleChat: () => void;
  setOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Connection
      connected: false,
      setConnected: (connected) => set({ connected }),

      // Topics
      topics: [],
      currentTopicId: 0,
      setTopics: (topics) => set({ topics }),
      setCurrentTopic: (topicId) => set({ currentTopicId: topicId }),

      // Messages
      messages: {},
      maxDisplayItems: 100,
      setMaxDisplayItems: (n) => set({ maxDisplayItems: n }),
      addMessage: (msg) =>
        set((state) => {
          const topicMsgs = state.messages[msg.topic_id] ?? [];
          // Idempotent: the same broadcast can arrive twice in dev when
          // StrictMode double-mounts the widget (two sockets briefly open).
          // We don't want duplicate-key warnings or visual duplicates.
          if (topicMsgs.some((m) => m.id === msg.id)) return state;
          const updated = [...topicMsgs, msg].slice(-state.maxDisplayItems);
          return {
            messages: { ...state.messages, [msg.topic_id]: updated },
          };
        }),
      setMessages: (topicId, msgs) =>
        set((state) => ({
          messages: { ...state.messages, [topicId]: msgs },
        })),
      hideMessage: (messageId) =>
        set((state) => {
          const newMessages: Record<number, ChatMessage[]> = {};
          for (const [tid, msgs] of Object.entries(state.messages)) {
            newMessages[Number(tid)] = msgs.map((m) =>
              m.id === messageId ? { ...m, is_hidden: true } : m
            );
          }
          return { messages: newMessages };
        }),

      // System messages
      systemMessages: {},
      pushSystemMessage: (partial) =>
        set((state) => {
          const id = `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const created_at = new Date().toISOString();
          const next: ChatSystemMessage = { ...partial, id, created_at };
          const existing = state.systemMessages[partial.topic_id] ?? [];
          const updated = [...existing, next].slice(-state.maxDisplayItems);
          return {
            systemMessages: {
              ...state.systemMessages,
              [partial.topic_id]: updated,
            },
          };
        }),

      // Fixed messages
      fixedMessages: {},
      setFixedMessage: (topicId, content) =>
        set((state) => ({
          fixedMessages: { ...state.fixedMessages, [topicId]: content },
        })),
      removeFixedMessage: (topicId) =>
        set((state) => {
          const { [topicId]: _, ...rest } = state.fixedMessages;
          return { fixedMessages: rest };
        }),

      // User counts
      userCounts: {},
      setUserCount: (topicId, count) =>
        set((state) => ({
          userCounts: { ...state.userCounts, [topicId]: count },
        })),

      // Notices
      notices: [],
      setNotices: (notices) => set({ notices }),

      // User state
      isBanned: false,
      setBanned: (banned) => set({ isBanned: banned }),
      muteUntil: null,
      setMuteUntil: (until) => set({ muteUntil: until }),

      // Spam
      spamState: { offenceCount: 0, penaltyUntil: null },
      recordSpamOffence: (penaltyUntil) =>
        set((state) => ({
          spamState: {
            offenceCount: state.spamState.offenceCount + 1,
            penaltyUntil,
          },
        })),
      resetSpamState: () =>
        set({ spamState: { offenceCount: 0, penaltyUntil: null } }),

      // Hidden users
      hiddenUsers: [],
      hideUser: (uid, displayname) =>
        set((state) => {
          if (state.hiddenUsers.some((h) => h.uid === uid)) return state;
          return {
            hiddenUsers: [...state.hiddenUsers, { uid, displayname }],
          };
        }),
      unhideUser: (uid) =>
        set((state) => ({
          hiddenUsers: state.hiddenUsers.filter((h) => h.uid !== uid),
        })),
      clearHiddenUsers: () => set({ hiddenUsers: [] }),

      // Chat settings
      chatSettings: {
        maxChatLength: 50,
        spamFrequencySeconds: 3,
        levelChat: 1,
        levelModerator: 5,
        rankSource: "trade",
      },
      setChatSettings: (settings) => set({ chatSettings: settings }),

      // Open/collapsed — controls mobile overlay visibility; desktop always shows sidebar
      isOpen: false,
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: "chat-store",
      // v2 changed `hiddenUsers` from `string[]` to `{uid, displayname}[]`.
      // Old entries don't carry displayname, so we drop them on upgrade —
      // users will rebuild the list via the chat menu.
      version: 2,
      migrate: (persistedState: any, version) => {
        if (
          version < 2 &&
          Array.isArray(persistedState?.hiddenUsers) &&
          persistedState.hiddenUsers.length > 0 &&
          typeof persistedState.hiddenUsers[0] === "string"
        ) {
          persistedState.hiddenUsers = [];
        }
        return persistedState;
      },
      partialize: (state) => ({
        hiddenUsers: state.hiddenUsers,
        isOpen: state.isOpen,
        currentTopicId: state.currentTopicId,
      }),
    }
  )
);
