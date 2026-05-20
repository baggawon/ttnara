//! Direct DB access. Owns the chat-table reads and writes for the chat_server.
//! Tables we *write* go through sea-orm entities; tables we only *read* (most
//! of the chat_* config family + Prisma's implicit M:N ban table) go through
//! raw SQL since their entity definitions would only get used here anyway.

use crate::helpers::tables::{chat_message, chat_muted_user};
use crate::protocol::{ChatMessage, ChatNotice};
use chrono::{NaiveDateTime, Utc};
use sea_orm::sea_query::OnConflict;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, DatabaseBackend,
    DatabaseConnection, DbErr, EntityTrait, FromQueryResult, QueryFilter, QueryOrder, QuerySelect,
    Statement,
};
use uuid::Uuid;

const SCHEMA: &str = "Platypus";

/// Snapshot of `chat_setting` (single row). `level_moderator` /
/// `chat_delete_hours` aren't read by the send path yet but are loaded so the
/// admin event handler can pick them up without a second SELECT once we wire
/// moderator-only features and the periodic purge.
#[allow(dead_code)]
#[derive(Debug, Clone, FromQueryResult)]
pub struct ChatSettingsRow {
    pub level_moderator: i32,
    pub level_chat: i32,
    pub max_chat_length: i32,
    pub max_display_items: i32,
    pub spam_frequency_seconds: i32,
    pub spam_penalty_second: i32,
    pub spam_penalty_third: i32,
    pub spam_penalty_last: i32,
    pub chat_delete_hours: i32,
}

impl Default for ChatSettingsRow {
    fn default() -> Self {
        Self {
            level_moderator: 5,
            level_chat: 1,
            max_chat_length: 50,
            max_display_items: 100,
            spam_frequency_seconds: 3,
            spam_penalty_second: 1,
            spam_penalty_third: 5,
            spam_penalty_last: 30,
            chat_delete_hours: 24,
        }
    }
}

// Only `id` is used today (existence check on connect / topic switch).
// `name` / `display_order` / `is_active` are kept so we can extend the
// connect-time payload without changing the query.
#[allow(dead_code)]
#[derive(Debug, Clone, FromQueryResult)]
pub struct ChatTopicRow {
    pub id: i32,
    pub name: String,
    pub display_order: i32,
    pub is_active: bool,
}

#[derive(Debug, Clone, FromQueryResult)]
pub struct ChatNoticeRow {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub display_order: i32,
}

impl From<ChatNoticeRow> for ChatNotice {
    fn from(r: ChatNoticeRow) -> Self {
        Self {
            id: r.id,
            title: r.title,
            content: r.content,
            display_order: r.display_order,
        }
    }
}

#[derive(Debug, Clone, FromQueryResult)]
pub struct BannedWordRow {
    pub word: String,
}

#[derive(Debug, Clone, FromQueryResult)]
pub struct FixedMessageRow {
    pub topic_id: i32,
    pub content: String,
}

pub async fn load_settings(db: &DatabaseConnection) -> Result<ChatSettingsRow, DbErr> {
    let stmt = Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        &format!(
            r#"SELECT "level_moderator","level_chat","max_chat_length","max_display_items",
                      "spam_frequency_seconds","spam_penalty_second","spam_penalty_third",
                      "spam_penalty_last","chat_delete_hours"
               FROM "{SCHEMA}"."chat_setting" ORDER BY "id" ASC LIMIT 1"#
        ),
        [],
    );
    Ok(ChatSettingsRow::find_by_statement(stmt)
        .one(db)
        .await?
        .unwrap_or_default())
}

pub async fn load_topics(db: &DatabaseConnection) -> Result<Vec<ChatTopicRow>, DbErr> {
    let stmt = Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        &format!(
            r#"SELECT "id","name","display_order","is_active"
               FROM "{SCHEMA}"."chat_topic"
               WHERE "is_active" = true
               ORDER BY "display_order" ASC, "id" ASC"#
        ),
        [],
    );
    ChatTopicRow::find_by_statement(stmt).all(db).await
}

pub async fn load_active_notices(db: &DatabaseConnection) -> Result<Vec<ChatNoticeRow>, DbErr> {
    let stmt = Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        &format!(
            r#"SELECT "id","title","content","display_order"
               FROM "{SCHEMA}"."chat_notice"
               WHERE "is_active" = true
               ORDER BY "display_order" ASC, "id" ASC"#
        ),
        [],
    );
    ChatNoticeRow::find_by_statement(stmt).all(db).await
}

pub async fn load_banned_words(db: &DatabaseConnection) -> Result<Vec<String>, DbErr> {
    let stmt = Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        &format!(r#"SELECT "word" FROM "{SCHEMA}"."chat_banned_word""#),
        [],
    );
    let rows = BannedWordRow::find_by_statement(stmt).all(db).await?;
    Ok(rows.into_iter().map(|r| r.word).collect())
}

pub async fn load_active_fixed_messages(
    db: &DatabaseConnection,
) -> Result<Vec<FixedMessageRow>, DbErr> {
    let stmt = Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        &format!(
            r#"SELECT "topic_id","content"
               FROM "{SCHEMA}"."chat_fixed_message"
               WHERE "is_active" = true"#
        ),
        [],
    );
    FixedMessageRow::find_by_statement(stmt).all(db).await
}

/// Returns the active mute expiry for `uid`, or None if not muted.
pub async fn current_mute(
    db: &DatabaseConnection,
    uid: &str,
) -> Result<Option<NaiveDateTime>, DbErr> {
    let row = chat_muted_user::Entity::find()
        .filter(chat_muted_user::Column::Uid.eq(uid))
        .one(db)
        .await?;
    let now = Utc::now().naive_utc();
    Ok(row.and_then(|r| if r.until > now { Some(r.until) } else { None }))
}

/// True if the user is in `_ChatBannedUsers`. Prisma's implicit M:N table
/// stores `(A,B)` where A=chat_setting.id and B=user.id.
pub async fn is_banned(db: &DatabaseConnection, uid: &str) -> Result<bool, DbErr> {
    let stmt = Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        &format!(r#"SELECT 1 AS hit FROM "{SCHEMA}"."_ChatBannedUsers" WHERE "B" = $1 LIMIT 1"#),
        [uid.into()],
    );
    Ok(db.query_one(stmt).await?.is_some())
}

/// Inserts a row into `chat_moderation_log`. Best-effort — never bubbles
/// errors so the send pipeline isn't blocked by an audit-log hiccup.
pub async fn log_moderation(
    db: &DatabaseConnection,
    action: &str,
    target_uid: Option<&str>,
    topic_id: Option<i32>,
    metadata: Option<serde_json::Value>,
) {
    let stmt = Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        &format!(
            r#"INSERT INTO "{SCHEMA}"."chat_moderation_log"
                  ("action","target_uid","topic_id","metadata","created_at")
               VALUES ($1, $2, $3, $4, NOW())"#
        ),
        [
            action.into(),
            target_uid.map(|s| s.to_string()).into(),
            topic_id.into(),
            metadata.into(),
        ],
    );
    if let Err(e) = db.execute(stmt).await {
        tracing::warn!(error = ?e, action, "log_moderation failed");
    }
}

/// Inserts and returns the persisted message in the protocol-shaped form.
#[allow(clippy::too_many_arguments)]
pub async fn insert_message(
    db: &DatabaseConnection,
    topic_id: i32,
    uid: &str,
    displayname: &str,
    rank_level: i32,
    rank_image: Option<&str>,
    content: &str,
) -> Result<ChatMessage, DbErr> {
    // UUID v7 = time-sortable; useful for keyset pagination later.
    let id = Uuid::now_v7().to_string();
    let now = Utc::now().naive_utc();

    let row = chat_message::ActiveModel {
        id: ActiveValue::Set(id.clone()),
        topic_id: ActiveValue::Set(topic_id),
        uid: ActiveValue::Set(uid.to_string()),
        displayname: ActiveValue::Set(displayname.to_string()),
        rank_level: ActiveValue::Set(rank_level),
        rank_image: ActiveValue::Set(rank_image.map(|s| s.to_string())),
        content: ActiveValue::Set(content.to_string()),
        is_hidden: ActiveValue::Set(false),
        hidden_by_id: ActiveValue::Set(None),
        hidden_at: ActiveValue::Set(None),
        created_at: ActiveValue::Set(now),
    };
    row.insert(db).await?;

    Ok(ChatMessage {
        id,
        uid: uid.to_string(),
        displayname: displayname.to_string(),
        rank_level,
        rank_image: rank_image.map(|s| s.to_string()),
        content: content.to_string(),
        topic_id,
        created_at: format_iso(now),
        is_hidden: None,
    })
}

pub async fn latest_messages(
    db: &DatabaseConnection,
    topic_id: i32,
    limit: u64,
) -> Result<Vec<ChatMessage>, DbErr> {
    let mut rows = chat_message::Entity::find()
        .filter(chat_message::Column::TopicId.eq(topic_id))
        .order_by_desc(chat_message::Column::CreatedAt)
        .limit(limit)
        .all(db)
        .await?;
    // Return oldest-first so the client appends in order.
    rows.reverse();
    Ok(rows.into_iter().map(model_to_protocol).collect())
}

fn model_to_protocol(m: chat_message::Model) -> ChatMessage {
    ChatMessage {
        id: m.id,
        uid: m.uid,
        displayname: m.displayname,
        rank_level: m.rank_level,
        rank_image: m.rank_image,
        content: m.content,
        topic_id: m.topic_id,
        created_at: format_iso(m.created_at),
        is_hidden: if m.is_hidden { Some(true) } else { None },
    }
}

fn format_iso(t: NaiveDateTime) -> String {
    // The frontend just calls `new Date(...)` on this string; ISO-ish UTC works.
    t.and_utc().to_rfc3339()
}

/// Upserts a row in `chat_muted_user`. Used by admin commands in step 5+; kept
/// here so the DB module has a single mute API surface.
#[allow(dead_code)]
pub async fn upsert_mute(
    db: &DatabaseConnection,
    uid: &str,
    until: NaiveDateTime,
    by_admin_id: Option<&str>,
    reason: Option<&str>,
) -> Result<(), DbErr> {
    let now = Utc::now().naive_utc();
    let active = chat_muted_user::ActiveModel {
        uid: ActiveValue::Set(uid.to_string()),
        until: ActiveValue::Set(until),
        by_admin_id: ActiveValue::Set(by_admin_id.map(|s| s.to_string())),
        reason: ActiveValue::Set(reason.map(|s| s.to_string())),
        created_at: ActiveValue::Set(now),
        updated_at: ActiveValue::Set(now),
    };
    chat_muted_user::Entity::insert(active)
        .on_conflict(
            OnConflict::column(chat_muted_user::Column::Uid)
                .update_columns([
                    chat_muted_user::Column::Until,
                    chat_muted_user::Column::ByAdminId,
                    chat_muted_user::Column::Reason,
                    chat_muted_user::Column::UpdatedAt,
                ])
                .to_owned(),
        )
        .exec(db)
        .await
        .map(|_| ())
}

#[allow(dead_code)]
pub async fn delete_mute(db: &DatabaseConnection, uid: &str) -> Result<(), DbErr> {
    chat_muted_user::Entity::delete_by_id(uid.to_string())
        .exec(db)
        .await
        .map(|_| ())
}
