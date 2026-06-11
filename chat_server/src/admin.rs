//! Internal admin event ingress: `POST /internal/event`. Called by the Next.js
//! app after it commits an admin-side change (mute, ban, hide, fixed message,
//! config tweak, etc). The chat_server's job here is to:
//!   - refresh its config cache when the change affects cached state, and
//!   - push the corresponding WS frame(s) so connected clients see the
//!     change without waiting for the 30s polling refresh.
//!
//! Auth: HMAC-SHA256 of the request body, hex-encoded, in `X-Chat-Signature`,
//! plus a Unix-second `X-Chat-Timestamp` header to bound replay windows.

use crate::protocol::{ChatNotice, ServerFrame};
use crate::state::AppState;
use axum::body::{Body, to_bytes};
use axum::extract::{Request, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use chrono::{DateTime, Utc};
use hmac::{Hmac, Mac};
use serde::Deserialize;
use sha2::Sha256;
use std::env;
use subtle::ConstantTimeEq;
use tracing::{debug, warn};

const SIG_HEADER: &str = "x-chat-signature";
const TS_HEADER: &str = "x-chat-timestamp";
const REPLAY_WINDOW_SECS: i64 = 300;
const MAX_BODY_BYTES: usize = 64 * 1024;

// Some variants only consume their fields for deserialization (Unban needs no
// broadcast; UnhideMessage has no wire-protocol counterpart) — silence the
// resulting dead-code warnings rather than peppering the variants with `_`.
#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
enum AdminEvent {
    /// Settings/topics/banned-words/fixed-messages were changed; refresh cache.
    /// (Notice changes use `NoticesChanged` so we can broadcast.)
    ConfigChanged,
    NoticesChanged,
    Mute {
        uid: String,
        until: DateTime<Utc>,
    },
    Unmute {
        uid: String,
    },
    /// Admin cleared a user's spam state (offence counter + active penalty)
    /// without it being a mute/unmute. Lets a user the spam tracker has
    /// throttled chat again immediately.
    ForgiveSpam {
        uid: String,
    },
    Ban {
        uid: String,
    },
    Unban {
        uid: String,
    },
    HideMessage {
        message_id: String,
        topic_id: i32,
    },
    UnhideMessage {
        message_id: String,
        topic_id: i32,
    },
    SetFixed {
        topic_id: i32,
        content: String,
    },
    UnsetFixed {
        topic_id: i32,
    },
}

pub async fn admin_handler(
    State(state): State<AppState>,
    req: Request<Body>,
) -> impl IntoResponse {
    let bytes = match authenticate(req).await {
        Ok(b) => b,
        Err(status) => return status.into_response(),
    };

    let event: AdminEvent = match serde_json::from_slice(&bytes) {
        Ok(e) => e,
        Err(e) => {
            debug!(error = %e, "admin event parse failed");
            return StatusCode::BAD_REQUEST.into_response();
        }
    };

    apply_event(&state, event).await;
    StatusCode::NO_CONTENT.into_response()
}

/// `GET /internal/spam-state` — dumps the SpamTracker for the admin panel's
/// 스팸 유저 tab. Same HMAC scheme as `/internal/event`, signed over the
/// (empty) request body.
pub async fn spam_state_handler(
    State(state): State<AppState>,
    req: Request<Body>,
) -> impl IntoResponse {
    if let Err(status) = authenticate(req).await {
        return status.into_response();
    }

    let users: Vec<serde_json::Value> = state
        .spam
        .snapshot()
        .into_iter()
        .map(|row| {
            serde_json::json!({
                "uid": row.uid,
                "offences": row.offences,
                "penalty_until": row.penalty_until.map(|t| t.to_rfc3339()),
                "memory_until": row.memory_until.map(|t| t.to_rfc3339()),
            })
        })
        .collect();

    axum::Json(serde_json::json!({ "users": users })).into_response()
}

/// Shared HMAC gate for `/internal/*` routes. Returns the request body on
/// success so POST handlers can parse it (GET bodies are simply empty).
async fn authenticate(req: Request<Body>) -> Result<axum::body::Bytes, StatusCode> {
    let secret = match env::var("CHAT_INTERNAL_SECRET") {
        Ok(s) if !s.is_empty() => s,
        _ => {
            warn!("CHAT_INTERNAL_SECRET unset; rejecting internal request");
            return Err(StatusCode::SERVICE_UNAVAILABLE);
        }
    };

    let (parts, body) = req.into_parts();

    let sig_hex = parts
        .headers
        .get(SIG_HEADER)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();
    let ts_str = parts
        .headers
        .get(TS_HEADER)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    let bytes = to_bytes(body, MAX_BODY_BYTES)
        .await
        .map_err(|_| StatusCode::PAYLOAD_TOO_LARGE)?;

    if !verify_signature(&secret, &ts_str, &bytes, &sig_hex) {
        debug!("internal request signature rejected");
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(bytes)
}

fn verify_signature(secret: &str, ts: &str, body: &[u8], sig_hex: &str) -> bool {
    let Ok(ts_int) = ts.parse::<i64>() else {
        return false;
    };
    let now = Utc::now().timestamp();
    if (now - ts_int).abs() > REPLAY_WINDOW_SECS {
        return false;
    }

    let Ok(provided) = hex::decode(sig_hex) else {
        return false;
    };

    type HmacSha256 = Hmac<Sha256>;
    let Ok(mut mac) = HmacSha256::new_from_slice(secret.as_bytes()) else {
        return false;
    };
    mac.update(ts.as_bytes());
    mac.update(b".");
    mac.update(body);
    let expected = mac.finalize().into_bytes();

    if expected.len() != provided.len() {
        return false;
    }
    expected.as_slice().ct_eq(&provided).into()
}

async fn apply_event(state: &AppState, event: AdminEvent) {
    match event {
        AdminEvent::ConfigChanged => {
            state.cache.refresh(&state.db).await;
        }
        AdminEvent::NoticesChanged => {
            state.cache.refresh(&state.db).await;
            let snapshot = state.cache.snapshot().await;
            let notices: Vec<ChatNotice> = snapshot.notices.clone();
            state
                .registry
                .broadcast_all(&ServerFrame::NoticeUpdate { notices });
        }
        AdminEvent::Mute { uid, until } => {
            state.registry.send_to_user(
                &uid,
                &ServerFrame::UserMuted {
                    is_self: true,
                    until: until.to_rfc3339(),
                },
            );
        }
        AdminEvent::Unmute { uid } => {
            state.spam.reset(&uid);
            state
                .registry
                .send_to_user(&uid, &ServerFrame::UserUnmuted { is_self: true });
        }
        AdminEvent::ForgiveSpam { uid } => {
            // Spam throttling is enforced purely server-side in the tracker
            // (no client mute frame is ever sent for it), so clearing the
            // tracker is all that's needed — the user's next send is allowed.
            state.spam.reset(&uid);
        }
        AdminEvent::Ban { uid } => {
            // Don't kick: the user stays connected (and sees the banned
            // overlay), so a follow-up Unban can still reach them via
            // `send_to_user`. The pipeline's `is_banned` DB check blocks
            // any future send_message attempts regardless.
            state
                .registry
                .send_to_user(&uid, &ServerFrame::UserBanned { is_self: true });
        }
        AdminEvent::Unban { uid } => {
            // The kicked user usually reconnects (anonymous-style read-only
            // would be a 401-with-token mismatch, but their JWT is still
            // valid so they re-establish). Pushing the frame clears their
            // banned overlay without requiring a page refresh.
            state
                .registry
                .send_to_user(&uid, &ServerFrame::UserUnbanned { is_self: true });
        }
        AdminEvent::HideMessage {
            message_id,
            topic_id,
        } => {
            state
                .registry
                .broadcast(topic_id, &ServerFrame::MessageHidden { message_id });
        }
        AdminEvent::UnhideMessage { .. } => {
            // The wire protocol has no "unhide" frame; clients see the
            // restored message on their next page reload / reconnect.
        }
        AdminEvent::SetFixed { topic_id, content } => {
            state
                .registry
                .broadcast(topic_id, &ServerFrame::MessageFixed { topic_id, content });
        }
        AdminEvent::UnsetFixed { topic_id } => {
            state
                .registry
                .broadcast(topic_id, &ServerFrame::MessageFixedRemoved { topic_id });
        }
    }
}
