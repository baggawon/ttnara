//! Periodically-refreshed snapshot of read-mostly chat config tables.
//! Refreshing in the background means the send pipeline never has to round-trip
//! to Postgres for settings/topics/notices/banned-words.

use crate::db;
use crate::filters::BannedWords;
use crate::protocol::ChatNotice;
use sea_orm::DatabaseConnection;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{Duration, interval};

#[derive(Default)]
pub struct CacheData {
    pub settings: db::ChatSettingsRow,
    pub topics: Vec<db::ChatTopicRow>,
    pub notices: Vec<ChatNotice>,
    pub fixed_messages: HashMap<i32, String>,
    pub banned_words: Arc<BannedWords>,
}

pub struct ConfigCache {
    inner: RwLock<Arc<CacheData>>,
}

impl ConfigCache {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            inner: RwLock::new(Arc::new(CacheData {
                banned_words: Arc::new(BannedWords::empty()),
                ..Default::default()
            })),
        })
    }

    pub async fn snapshot(&self) -> Arc<CacheData> {
        self.inner.read().await.clone()
    }

    pub async fn refresh(&self, db: &DatabaseConnection) {
        let settings = db::load_settings(db).await.unwrap_or_default();
        let topics = db::load_topics(db).await.unwrap_or_default();
        let notice_rows = db::load_active_notices(db).await.unwrap_or_default();
        let words = db::load_banned_words(db).await.unwrap_or_default();
        let fixed_rows = db::load_active_fixed_messages(db).await.unwrap_or_default();

        let mut fixed_map = HashMap::new();
        for r in fixed_rows {
            // If multiple rows ever exist per topic, last write wins; the
            // admin layer should enforce uniqueness.
            fixed_map.insert(r.topic_id, r.content);
        }

        let data = CacheData {
            settings,
            topics,
            notices: notice_rows.into_iter().map(Into::into).collect(),
            fixed_messages: fixed_map,
            banned_words: Arc::new(BannedWords::build(&words)),
        };
        *self.inner.write().await = Arc::new(data);
    }
}

/// Background task: refreshes the config cache every 30 s.
pub async fn run_refresher(db: DatabaseConnection, cache: Arc<ConfigCache>) {
    let mut tick = interval(Duration::from_secs(30));
    // First tick fires immediately; that's fine — `main` already did an
    // initial refresh, this just keeps the cache warm.
    loop {
        tick.tick().await;
        cache.refresh(&db).await;
    }
}
