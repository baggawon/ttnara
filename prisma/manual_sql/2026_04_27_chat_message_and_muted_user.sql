-- Adds tables that back the chat server (chat_message persistence + active mute list).
-- Apply with one of:
--   psql "$DATABASE_URL" -f prisma/manual_sql/2026_04_27_chat_message_and_muted_user.sql
--   docker exec -i db psql -U postgres -d postgres < prisma/manual_sql/2026_04_27_chat_message_and_muted_user.sql

SET search_path TO "Platypus";

CREATE TABLE IF NOT EXISTS "Platypus"."chat_message" (
    "id"           TEXT         PRIMARY KEY,
    "topic_id"     INTEGER      NOT NULL,
    "uid"          TEXT         NOT NULL,
    "displayname"  VARCHAR(50)  NOT NULL,
    "rank_level"   INTEGER      NOT NULL DEFAULT 1,
    "rank_image"   TEXT,
    "content"      VARCHAR(500) NOT NULL,
    "is_hidden"    BOOLEAN      NOT NULL DEFAULT false,
    "hidden_by_id" TEXT,
    "hidden_at"    TIMESTAMP(3),
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "chat_message_topic_id_created_at_idx"
    ON "Platypus"."chat_message" ("topic_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "chat_message_uid_idx"
    ON "Platypus"."chat_message" ("uid");
CREATE INDEX IF NOT EXISTS "chat_message_created_at_idx"
    ON "Platypus"."chat_message" ("created_at");

CREATE TABLE IF NOT EXISTS "Platypus"."chat_muted_user" (
    "uid"         TEXT         PRIMARY KEY,
    "until"       TIMESTAMP(3) NOT NULL,
    "by_admin_id" TEXT,
    "reason"      VARCHAR(200),
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "chat_muted_user_until_idx"
    ON "Platypus"."chat_muted_user" ("until");
