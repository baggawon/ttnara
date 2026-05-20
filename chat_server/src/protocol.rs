//! Wire protocol shared with the Next.js frontend (`useChatWebSocket.ts`).
//! Every variant here corresponds to a `data.type` string the client emits or expects.

use serde::{Deserialize, Serialize};

/// Frames sent by the client to the server.
#[derive(Debug, Deserialize)]
#[serde(tag = "type", content = "payload", rename_all = "snake_case")]
pub enum ClientFrame {
    SendMessage { topic_id: i32, content: String },
    SwitchTopic { topic_id: i32 },
}

/// A persisted message, mirroring `ChatMessage` in `src/helpers/chatStore.ts`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub uid: String,
    pub displayname: String,
    pub rank_level: i32,
    pub rank_image: Option<String>,
    pub content: String,
    pub topic_id: i32,
    pub created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_hidden: Option<bool>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChatNotice {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub display_order: i32,
}

/// Frames sent by the server to a client. The `type` tag matches the strings
/// in `useChatWebSocket.ts::handleMessage`.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", content = "payload", rename_all = "snake_case")]
pub enum ServerFrame {
    Message(ChatMessage),
    MessagesInit {
        topic_id: i32,
        messages: Vec<ChatMessage>,
    },
    MessageHidden {
        message_id: String,
    },
    MessageFixed {
        topic_id: i32,
        content: String,
    },
    MessageFixedRemoved {
        topic_id: i32,
    },
    UserMuted {
        is_self: bool,
        until: String,
    },
    UserUnmuted {
        is_self: bool,
    },
    UserBanned {
        is_self: bool,
    },
    UserUnbanned {
        is_self: bool,
    },
    UserCount {
        topic_id: i32,
        count: usize,
    },
    NoticeUpdate {
        notices: Vec<ChatNotice>,
    },
    Error {
        code: ErrorCode,
        message: String,
        /// Expiry for time-bound errors (spam penalty / mute). RFC3339 UTC.
        /// Lets the client render an accurate countdown without recomputing.
        #[serde(skip_serializing_if = "Option::is_none")]
        until: Option<String>,
    },
}

/// Error codes consumed by `useChatWebSocket.ts::handleError`.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    SpamWarning,
    SpamPenalty1,
    SpamPenalty2,
    SpamPenalty3,
    Muted,
    Banned,
    /// Message contained one or more banned words. Sent in addition to the
    /// (possibly masked) broadcast so the offending user gets a heads-up.
    BannedWord,
    /// Used when a frame is structurally invalid; client treats as no-op.
    BadRequest,
}
