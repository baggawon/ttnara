//! Tracks live WS connections, keyed by topic. One user can have multiple
//! sockets (multiple tabs) — each socket is identified by a unique
//! `ConnectionId` so we can address sender vs broadcast precisely.

use crate::protocol::ServerFrame;
use dashmap::DashMap;
use serde_json::to_string;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use tokio::sync::mpsc;

pub type ConnectionId = u64;

// `auth_level` is captured at connect time and reserved for moderator-aware
// routing (e.g. delivering admin-only frames). Not read on the hot path yet.
#[allow(dead_code)]
#[derive(Clone)]
pub struct Connection {
    pub id: ConnectionId,
    pub uid: String,
    pub topic_id: i32,
    pub auth_level: i32,
    pub tx: mpsc::UnboundedSender<String>,
}

impl Connection {
    /// Best-effort send; ignores closed channels (the receiver will clean up).
    pub fn send(&self, frame: &ServerFrame) {
        if let Ok(payload) = to_string(frame) {
            let _ = self.tx.send(payload);
        }
    }
}

#[derive(Default)]
pub struct Registry {
    /// `topic_id -> connection_id -> Connection`
    by_topic: DashMap<i32, DashMap<ConnectionId, Connection>>,
    next_id: AtomicU64,
}

impl Registry {
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }

    pub fn next_connection_id(&self) -> ConnectionId {
        self.next_id.fetch_add(1, Ordering::Relaxed)
    }

    pub fn insert(&self, conn: Connection) {
        self.by_topic
            .entry(conn.topic_id)
            .or_default()
            .insert(conn.id, conn);
    }

    pub fn remove(&self, topic_id: i32, conn_id: ConnectionId) {
        if let Some(topic) = self.by_topic.get(&topic_id) {
            topic.remove(&conn_id);
        }
    }

    /// Move an existing connection to a different topic (used by `switch_topic`).
    pub fn move_topic(&self, conn_id: ConnectionId, from: i32, to: i32) {
        let Some(prev) = self.by_topic.get(&from).and_then(|t| t.remove(&conn_id)) else {
            return;
        };
        let mut conn = prev.1;
        conn.topic_id = to;
        self.by_topic.entry(to).or_default().insert(conn.id, conn);
    }

    /// Number of distinct UIDs currently watching `topic_id`.
    pub fn user_count(&self, topic_id: i32) -> usize {
        let Some(topic) = self.by_topic.get(&topic_id) else {
            return 0;
        };
        let mut uids: std::collections::HashSet<String> = std::collections::HashSet::new();
        for entry in topic.iter() {
            uids.insert(entry.value().uid.clone());
        }
        uids.len()
    }

    pub fn broadcast(&self, topic_id: i32, frame: &ServerFrame) {
        let Some(topic) = self.by_topic.get(&topic_id) else {
            return;
        };
        let payload = match to_string(frame) {
            Ok(s) => s,
            Err(_) => return,
        };
        for entry in topic.iter() {
            let _ = entry.value().tx.send(payload.clone());
        }
    }

    /// Broadcasts to every connection across every topic.
    pub fn broadcast_all(&self, frame: &ServerFrame) {
        let payload = match to_string(frame) {
            Ok(s) => s,
            Err(_) => return,
        };
        for topic_entry in self.by_topic.iter() {
            for conn_entry in topic_entry.value().iter() {
                let _ = conn_entry.value().tx.send(payload.clone());
            }
        }
    }

    /// Send `frame` to every socket belonging to `uid` across all topics.
    pub fn send_to_user(&self, uid: &str, frame: &ServerFrame) {
        let payload = match to_string(frame) {
            Ok(s) => s,
            Err(_) => return,
        };
        for topic_entry in self.by_topic.iter() {
            for conn_entry in topic_entry.value().iter() {
                if conn_entry.value().uid == uid {
                    let _ = conn_entry.value().tx.send(payload.clone());
                }
            }
        }
    }

    /// Removes a user's connections from the registry without touching the
    /// underlying WebSockets. **Currently unused** — banning leaves the user
    /// connected so that follow-up admin frames (e.g. UserUnbanned) can still
    /// reach them via `send_to_user`. Kept around in case we add a real
    /// "force disconnect" admin action later.
    #[allow(dead_code)]
    pub fn kick_user(&self, uid: &str) {
        for topic_entry in self.by_topic.iter() {
            let to_remove: Vec<ConnectionId> = topic_entry
                .value()
                .iter()
                .filter(|e| e.value().uid == uid)
                .map(|e| *e.key())
                .collect();
            for id in to_remove {
                topic_entry.value().remove(&id);
            }
        }
    }
}
