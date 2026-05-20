//! Inbound message handling: validate → mute/ban check → spam check →
//! banned-word mask → persist → broadcast.

use crate::auth::ChatClaims;
use crate::cache::CacheData;
use crate::db;
use crate::protocol::{ErrorCode, ServerFrame};
use crate::registry::Connection;
use crate::spam::{SpamConfig, SpamVerdict};
use crate::state::AppState;
use std::sync::Arc;
use tracing::{debug, error, info, warn};

pub async fn handle_send_message(
    state: &AppState,
    conn: &Connection,
    claims: &ChatClaims,
    topic_id: i32,
    content: String,
) {
    // The caller (`ws::run_session`) passes the up-to-date `current_topic` in
    // `topic_id`. `conn.topic_id` is the snapshot from WS-open time and goes
    // stale after a `switch_topic`, so we trust the param.
    debug!(uid = %claims.sub, topic_id, len = content.len(), "send_message received");

    let snapshot = state.cache.snapshot().await;

    let trimmed = content.trim();
    if trimmed.is_empty() {
        debug!(uid = %claims.sub, "send_message dropped: empty");
        return;
    }
    if (trimmed.chars().count() as i32) > snapshot.settings.max_chat_length {
        send_error(
            conn,
            ErrorCode::BadRequest,
            "메시지가 너무 깁니다.",
            None,
        );
        return;
    }

    // Auth-level gate (mirrors `chat_setting.level_chat`).
    if claims.auth_level < snapshot.settings.level_chat {
        info!(
            uid = %claims.sub,
            auth_level = claims.auth_level,
            level_chat = snapshot.settings.level_chat,
            "send_message rejected: auth_level below level_chat"
        );
        send_error(conn, ErrorCode::BadRequest, "채팅 권한이 없습니다.", None);
        return;
    }

    // Permanent ban — tell frontend and drop the message. We don't kick
    // because that would orphan the connection (see admin.rs Ban handler).
    match db::is_banned(&state.db, &claims.sub).await {
        Ok(true) => {
            send_error(conn, ErrorCode::Banned, "채팅 이용이 제한되었습니다.", None);
            state.registry.send_to_user(
                &claims.sub,
                &ServerFrame::UserBanned { is_self: true },
            );
            return;
        }
        Ok(false) => {}
        Err(e) => {
            error!(error = ?e, uid = %claims.sub, "is_banned lookup failed");
            return;
        }
    }

    // Active mute (timed).
    match db::current_mute(&state.db, &claims.sub).await {
        Ok(Some(until)) => {
            send_error(
                conn,
                ErrorCode::Muted,
                "뮤트 상태입니다.",
                Some(until.and_utc()),
            );
            conn.send(&ServerFrame::UserMuted {
                is_self: true,
                until: until.and_utc().to_rfc3339(),
            });
            return;
        }
        Ok(None) => {}
        Err(e) => {
            error!(error = ?e, uid = %claims.sub, "current_mute lookup failed");
            return;
        }
    }

    // Spam window. Enforcement is server-side now — the frontend no longer
    // pre-blocks fast sends, so every attempt is counted here.
    let spam_cfg = SpamConfig {
        frequency_seconds: snapshot.settings.spam_frequency_seconds as u32,
        penalty_second: snapshot.settings.spam_penalty_second as u32,
        penalty_third: snapshot.settings.spam_penalty_third as u32,
        penalty_last: snapshot.settings.spam_penalty_last as u32,
    };
    match state.spam.record(&claims.sub, &spam_cfg) {
        SpamVerdict::Ok => {}
        SpamVerdict::Warning => {
            send_error(conn, ErrorCode::SpamWarning, "도배 경고", None);
            log_spam(state, &claims.sub, topic_id, "spam_warning", None).await;
            // First offence: drop the message (warning tier, no timed block).
            return;
        }
        SpamVerdict::Penalty1 { until } => {
            send_error(
                conn,
                ErrorCode::SpamPenalty1,
                "도배 제한 (1단계)",
                Some(until),
            );
            log_spam(state, &claims.sub, topic_id, "spam_penalty_1", Some(until)).await;
            return;
        }
        SpamVerdict::Penalty2 { until } => {
            send_error(
                conn,
                ErrorCode::SpamPenalty2,
                "도배 제한 (2단계)",
                Some(until),
            );
            log_spam(state, &claims.sub, topic_id, "spam_penalty_2", Some(until)).await;
            return;
        }
        SpamVerdict::Penalty3 { until } => {
            send_error(
                conn,
                ErrorCode::SpamPenalty3,
                "도배 제한 (3단계)",
                Some(until),
            );
            log_spam(state, &claims.sub, topic_id, "spam_penalty_3", Some(until)).await;
            return;
        }
        SpamVerdict::InPenalty { until } => {
            // User tried to send while still in a penalty window. Surface a
            // notice (with the same `until`) so the chat UI can show an
            // accurate countdown — silent drop was confusing.
            send_error(
                conn,
                ErrorCode::SpamPenalty1,
                "도배 제한 중입니다.",
                Some(until),
            );
            return;
        }
    }

    // Banned-word mask. If anything matched, notify the offender so they know
    // their message was filtered (the broadcast still goes out — masked — to
    // everyone else; we just don't leave the offender guessing).
    let (final_content, was_masked) = snapshot.banned_words.mask(trimmed);
    if was_masked {
        send_error(
            conn,
            ErrorCode::BannedWord,
            "메시지에 금지어가 포함되어 있습니다.",
            None,
        );
    }
    if final_content.chars().all(|c| c == '*') {
        // Whole message was banned words → drop without broadcast.
        return;
    }

    persist_and_broadcast(state, &snapshot, topic_id, claims, &final_content).await;
}

async fn persist_and_broadcast(
    state: &AppState,
    _snapshot: &Arc<CacheData>,
    topic_id: i32,
    claims: &ChatClaims,
    content: &str,
) {
    match db::insert_message(
        &state.db,
        topic_id,
        &claims.sub,
        &claims.displayname,
        claims.rank_level,
        claims.rank_image.as_deref(),
        content,
    )
    .await
    {
        Ok(msg) => {
            let recipients = state.registry.user_count(topic_id);
            info!(
                uid = %claims.sub,
                topic_id,
                msg_id = %msg.id,
                recipients,
                "send_message broadcast"
            );
            state.registry.broadcast(topic_id, &ServerFrame::Message(msg));
        }
        Err(e) => {
            warn!(error = ?e, topic_id, uid = %claims.sub, "failed to persist chat message");
        }
    }
}

fn send_error(
    conn: &Connection,
    code: ErrorCode,
    message: &str,
    until: Option<chrono::DateTime<chrono::Utc>>,
) {
    conn.send(&ServerFrame::Error {
        code,
        message: message.to_string(),
        until: until.map(|t| t.to_rfc3339()),
    });
}

async fn log_spam(
    state: &AppState,
    uid: &str,
    topic_id: i32,
    action: &str,
    until: Option<chrono::DateTime<chrono::Utc>>,
) {
    let metadata = until.map(|t| {
        serde_json::json!({ "until": t.to_rfc3339() })
    });
    db::log_moderation(&state.db, action, Some(uid), Some(topic_id), metadata).await;
}
