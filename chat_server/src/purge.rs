//! Background retention housekeeping. Periodically soft-deletes (hides) chat
//! messages older than `chat_setting.chat_delete_hours`. Soft delete means the
//! row is kept (for admin history / audit and the admin hard-delete tool) but
//! `is_hidden` is set so it disappears from the live widget. A retention value
//! of 0 (or less) disables the sweep — keep messages forever.

use crate::cache::ConfigCache;
use crate::db;
use sea_orm::DatabaseConnection;
use std::sync::Arc;
use tokio::time::{Duration, interval};
use tracing::{info, warn};

/// Sweep cadence. Retention is configured in hours, so an hourly sweep keeps
/// messages within roughly one tick of the configured window. The first tick
/// fires immediately, clearing any backlog on startup.
const PURGE_INTERVAL_SECS: u64 = 3600;

pub async fn run_purge(db: DatabaseConnection, cache: Arc<ConfigCache>) {
    let mut tick = interval(Duration::from_secs(PURGE_INTERVAL_SECS));
    loop {
        tick.tick().await;
        let hours = cache.snapshot().await.settings.chat_delete_hours;
        if hours <= 0 {
            continue; // retention disabled
        }
        match db::soft_delete_old_messages(&db, hours).await {
            Ok(0) => {}
            Ok(n) => info!(
                hidden = n,
                retention_hours = hours,
                "retention sweep hid old messages"
            ),
            Err(e) => warn!(error = ?e, "retention sweep failed"),
        }
    }
}
