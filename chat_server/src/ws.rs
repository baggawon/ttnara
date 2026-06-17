//! WebSocket upgrade handler + per-connection event loop.
//!
//! Connection URL: `ws(s)://<host>/ws?token=<jwt>&topic_id=<i32>`
//!
//! Auth is *optional*: a missing `token` param means anonymous read-only
//! viewer (gets `messages_init`, broadcasts, user_count, notices, fixed
//! messages — but `send_message` is silently dropped). A *present but invalid*
//! token still rejects, so callers can't get past auth by mangling the JWT.
//!
//! On upgrade we:
//! 1. If a token is present, verify it (reject 401 on failure).
//! 2. Look up the requested topic in the cache; reject if not active.
//! 3. Send `messages_init` (latest N messages), the current `notice_update`,
//!    a `message_fixed` if one exists for the topic, and `user_count`.
//! 4. Spawn an outbound writer task fed by the registry's mpsc channel.
//! 5. Drain inbound frames into the pipeline until the socket closes.

use crate::pipeline;
use crate::protocol::{ChatNotice, ClientFrame, ServerFrame};
use crate::registry::{Connection, ConnectionId};
use crate::state::AppState;
use axum::extract::{
    Query, State, WebSocketUpgrade,
    ws::{Message, WebSocket},
};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use futures_util::{SinkExt, StreamExt, stream::SplitSink};
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{debug, info, warn};

#[derive(Debug, Deserialize)]
pub struct WsParams {
    #[serde(default)]
    pub token: String,
    pub topic_id: i32,
}

pub async fn ws_handler(
    State(state): State<AppState>,
    Query(params): Query<WsParams>,
    ws: WebSocketUpgrade,
) -> Response {
    // Empty token = anonymous read-only viewer. Present-but-bad token = 401.
    let claims = if params.token.is_empty() {
        None
    } else {
        match state.jwt.verify(&params.token) {
            Ok(c) => Some(Arc::new(c)),
            Err(e) => {
                debug!(error = %e, "ws auth rejected");
                return (StatusCode::UNAUTHORIZED, "invalid token").into_response();
            }
        }
    };

    // Validate topic against the cache.
    let snapshot = state.cache.snapshot().await;
    if !snapshot.topics.iter().any(|t| t.id == params.topic_id) {
        return (StatusCode::BAD_REQUEST, "unknown topic").into_response();
    }

    let topic_id = params.topic_id;
    ws.on_upgrade(move |socket| run_session(state, socket, claims, topic_id))
}

async fn run_session(
    state: AppState,
    socket: WebSocket,
    claims: Option<Arc<crate::auth::ChatClaims>>,
    initial_topic: i32,
) {
    let (mut ws_sink, mut ws_stream) = socket.split();

    let conn_id: ConnectionId = state.registry.next_connection_id();
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    // Anonymous viewers get a synthetic per-connection uid so they don't
    // collide with real user records; auth_level=0 keeps them below any
    // chat-level gate. They count toward `user_count` like real viewers.
    let (uid, auth_level) = match &claims {
        Some(c) => (c.sub.clone(), c.auth_level),
        None => (format!("anon:{}", conn_id), 0),
    };

    let mut conn = Connection {
        id: conn_id,
        uid: uid.clone(),
        topic_id: initial_topic,
        auth_level,
        tx,
    };
    state.registry.insert(conn.clone());

    info!(conn_id, %uid, topic = initial_topic, anonymous = claims.is_none(), "ws connected");

    // Outbound writer: forwards mpsc -> websocket.
    let writer_task = tokio::spawn(async move {
        while let Some(payload) = rx.recv().await {
            if ws_sink.send(Message::Text(payload)).await.is_err() {
                break;
            }
        }
        let _ = ws_sink.close().await;
    });

    send_session_init(&state, &conn, initial_topic).await;
    broadcast_user_count(&state, initial_topic);

    // Inbound reader: parses ClientFrame and dispatches.
    let mut current_topic = initial_topic;
    while let Some(msg) = ws_stream.next().await {
        let msg = match msg {
            Ok(m) => m,
            Err(e) => {
                debug!(error = %e, "ws read error; closing");
                break;
            }
        };
        match msg {
            Message::Text(text) => {
                let frame: ClientFrame = match serde_json::from_str(&text) {
                    Ok(f) => f,
                    Err(e) => {
                        warn!(error = %e, "bad client frame");
                        continue;
                    }
                };
                match frame {
                    ClientFrame::SendMessage { topic_id: _, content: _ } if claims.is_none() => {
                        // Anonymous viewer — silently drop send attempts.
                        debug!(conn_id, "anonymous send_message dropped");
                    }
                    ClientFrame::SendMessage { topic_id, content } => {
                        // Pipeline trusts `current_topic`; the frame's
                        // topic_id is informational only.
                        let _ = topic_id;
                        let claims_ref = claims.as_ref().unwrap();
                        pipeline::handle_send_message(
                            &state,
                            &conn,
                            claims_ref,
                            current_topic,
                            content,
                        )
                        .await;
                    }
                    ClientFrame::SwitchTopic { topic_id } => {
                        if topic_id == current_topic {
                            continue;
                        }
                        let snapshot = state.cache.snapshot().await;
                        if !snapshot.topics.iter().any(|t| t.id == topic_id) {
                            continue;
                        }
                        let prev = current_topic;
                        state.registry.move_topic(conn.id, prev, topic_id);
                        current_topic = topic_id;
                        // Keep our local `conn` view in sync with the registry
                        // so any future read of `conn.topic_id` is correct.
                        conn.topic_id = topic_id;
                        send_session_init(&state, &conn, topic_id).await;
                        broadcast_user_count(&state, prev);
                        broadcast_user_count(&state, topic_id);
                        info!(conn_id, %uid, from = prev, to = topic_id, "switch_topic");
                    }
                }
            }
            Message::Ping(_) | Message::Pong(_) => {}
            Message::Close(_) => break,
            Message::Binary(_) => {}
        }
    }

    // Cleanup.
    state.registry.remove(current_topic, conn.id);
    drop(conn); // closes mpsc tx; writer_task exits.
    let _ = writer_task.await;
    broadcast_user_count(&state, current_topic);
    info!(conn_id, %uid, "ws disconnected");
}

async fn send_session_init(state: &AppState, conn: &Connection, topic_id: i32) {
    let snapshot = state.cache.snapshot().await;
    let max_items = snapshot.settings.max_display_items.max(1) as u64;

    // messages_init
    match crate::db::latest_messages(
        &state.db,
        topic_id,
        max_items,
        &snapshot.settings.chat_rank_source,
    )
    .await
    {
        Ok(mut messages) => {
            // `rank_image` is stored unsigned; sign each before delivery so the
            // client can load the badge from CloudFront.
            if let Some(signer) = state.signer.as_ref() {
                for m in messages.iter_mut() {
                    m.rank_image = signer.sign_opt(m.rank_image.take());
                }
            }
            conn.send(&ServerFrame::MessagesInit { topic_id, messages })
        }
        Err(e) => warn!(error = ?e, topic_id, "latest_messages failed"),
    }

    // notice_update
    let notices: Vec<ChatNotice> = snapshot.notices.clone();
    conn.send(&ServerFrame::NoticeUpdate { notices });

    // message_fixed (if any)
    if let Some(content) = snapshot.fixed_messages.get(&topic_id) {
        conn.send(&ServerFrame::MessageFixed {
            topic_id,
            content: content.clone(),
        });
    }
}

fn broadcast_user_count(state: &AppState, topic_id: i32) {
    let count = state.registry.user_count(topic_id);
    state.registry.broadcast(
        topic_id,
        &ServerFrame::UserCount { topic_id, count },
    );
}

// `axum`'s WebSocket re-exports a `Message` type that doesn't include the
// Frame variant we'd want for `Pong` autoresponse; keep this type alias here
// in case we want to swap WS engines later.
#[allow(dead_code)]
type WsSink = SplitSink<WebSocket, Message>;
