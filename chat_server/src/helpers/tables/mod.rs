//! Hand-written sea-orm entities for tables that the chat_server owns.
//! All other chat tables (chat_setting, chat_topic, chat_notice, chat_banned_word,
//! chat_fixed_message, chat_report, _ChatBannedUsers) are read via raw SQL since
//! we don't mutate them from this service.
//!
//! Run `node importSchema.js` to regenerate this folder against a live DB
//! when the schema changes.

pub mod prelude;

pub mod chat_message;
pub mod chat_muted_user;
