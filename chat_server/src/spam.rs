//! In-memory per-user spam tracker. Penalties and the "memory" of past
//! offences are short-lived and intentionally not persisted — a server restart
//! resets everyone, which is acceptable for spam throttling. Permanent bans
//! live in `_ChatBannedUsers`.
//!
//! Enforcement lives here, server-side: the frontend no longer pre-blocks
//! fast sends, so every attempt reaches `record()`. This also guards the chat
//! API against a client that bypasses the UI.

use chrono::{DateTime, Duration, Utc};
use dashmap::DashMap;
use std::sync::Arc;

/// Spam knobs pulled from `chat_setting` (penalty values are in minutes). The
/// penalty ladder doubles as the "memory window" ladder: how long an offence
/// is remembered before it's forgiven steps up with each tier.
#[derive(Clone, Copy, Debug)]
pub struct SpamConfig {
    pub frequency_seconds: u32,
    pub penalty_second: u32,
    pub penalty_third: u32,
    pub penalty_last: u32,
}

#[derive(Clone, Copy, Debug)]
pub enum SpamVerdict {
    /// Below the threshold — let the message through.
    Ok,
    /// First offence. Drop the message, send `SPAM_WARNING`. No timed block —
    /// the user may send again after the normal frequency interval.
    Warning,
    /// Repeated offence; drop the message and apply the configured penalty.
    Penalty1 { until: DateTime<Utc> },
    /// Drop + 3rd-tier penalty.
    Penalty2 { until: DateTime<Utc> },
    /// Drop + final-tier penalty.
    Penalty3 { until: DateTime<Utc> },
    /// User is currently in a penalty window — drop without counting a new
    /// offence.
    InPenalty { until: DateTime<Utc> },
}

#[derive(Default, Clone, Copy, Debug)]
struct Entry {
    last_sent: Option<DateTime<Utc>>,
    offences: u32,
    /// Active block: sends are rejected until this instant.
    penalty_until: Option<DateTime<Utc>>,
    /// The offence counter is forgiven (reset to 0) once `now` passes this.
    /// It starts when the current penalty ends and lasts for the *next*
    /// tier's penalty duration — i.e. behave that long and the slate clears.
    memory_until: Option<DateTime<Utc>>,
}

pub struct SpamTracker {
    inner: DashMap<String, Entry>,
}

impl SpamTracker {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            inner: DashMap::new(),
        })
    }

    /// Records an attempted send. Returns the verdict for the caller to act on.
    ///
    /// A too-fast send is always an offence and is always dropped (including
    /// the first, warning-tier one). The offence counter escalates the penalty
    /// and survives across windows until a clean stretch longer than the
    /// current tier's memory window forgives it.
    pub fn record(&self, uid: &str, cfg: &SpamConfig) -> SpamVerdict {
        let now = Utc::now();
        let mut entry = self.inner.entry(uid.to_string()).or_default();

        // Time-based forgiveness: a clean stretch past `memory_until` wipes the
        // offence history entirely.
        if let Some(until) = entry.memory_until {
            if until <= now {
                entry.offences = 0;
                entry.penalty_until = None;
                entry.memory_until = None;
            }
        }

        // Active penalty short-circuits everything — drop, don't re-count.
        if let Some(until) = entry.penalty_until {
            if until > now {
                return SpamVerdict::InPenalty { until };
            } else {
                entry.penalty_until = None;
            }
        }

        let too_fast = match entry.last_sent {
            Some(t) => (now - t) < Duration::seconds(cfg.frequency_seconds as i64),
            None => false,
        };

        // Every attempt — accepted or not — resets the interval clock, so a
        // burst keeps tripping instead of being measured from the last *good*
        // send.
        entry.last_sent = Some(now);

        if !too_fast {
            return SpamVerdict::Ok;
        }

        entry.offences += 1;

        // `penalty_min` blocks the user; `memory_min` is how long the offence
        // counter survives *after* that block ends. Both are reused from the
        // existing `spam_penalty_*` admin settings.
        let (penalty_min, memory_min) = match entry.offences {
            1 => (0, cfg.penalty_second),
            2 => (cfg.penalty_second, cfg.penalty_third),
            3 => (cfg.penalty_third, cfg.penalty_last),
            _ => (cfg.penalty_last, cfg.penalty_last),
        };

        let penalty_until = now + Duration::minutes(penalty_min as i64);
        entry.memory_until = Some(penalty_until + Duration::minutes(memory_min as i64));

        match entry.offences {
            // Warning tier: no timed block, but the message is still dropped.
            1 => {
                entry.penalty_until = None;
                SpamVerdict::Warning
            }
            2 => {
                entry.penalty_until = Some(penalty_until);
                SpamVerdict::Penalty1 {
                    until: penalty_until,
                }
            }
            3 => {
                entry.penalty_until = Some(penalty_until);
                SpamVerdict::Penalty2 {
                    until: penalty_until,
                }
            }
            _ => {
                entry.penalty_until = Some(penalty_until);
                SpamVerdict::Penalty3 {
                    until: penalty_until,
                }
            }
        }
    }

    /// Clears all spam state for a user (used on admin unmute / unban).
    #[allow(dead_code)]
    pub fn reset(&self, uid: &str) {
        self.inner.remove(uid);
    }

    /// Point-in-time view of every user with live spam state — an active
    /// penalty window and/or a remembered offence count. Mirrors the lapse
    /// logic in `record()` (a user who hasn't sent since their memory window
    /// expired still counts as clean) without mutating any entries.
    pub fn snapshot(&self) -> Vec<SpamStateRow> {
        let now = Utc::now();
        let mut rows: Vec<SpamStateRow> = self
            .inner
            .iter()
            .filter_map(|entry| {
                let e = entry.value();
                let remembered = e.offences > 0 && e.memory_until.is_some_and(|t| t > now);
                let penalty_until = e.penalty_until.filter(|t| *t > now);
                if !remembered && penalty_until.is_none() {
                    return None;
                }
                Some(SpamStateRow {
                    uid: entry.key().clone(),
                    offences: e.offences,
                    penalty_until,
                    memory_until: e.memory_until,
                })
            })
            .collect();
        // Actively blocked users first, then by offence count.
        rows.sort_by(|a, b| {
            b.penalty_until
                .is_some()
                .cmp(&a.penalty_until.is_some())
                .then(b.offences.cmp(&a.offences))
                .then(a.uid.cmp(&b.uid))
        });
        rows
    }
}

/// One user's spam state as reported to the admin panel.
#[derive(Clone, Debug)]
pub struct SpamStateRow {
    pub uid: String,
    pub offences: u32,
    pub penalty_until: Option<DateTime<Utc>>,
    pub memory_until: Option<DateTime<Utc>>,
}
