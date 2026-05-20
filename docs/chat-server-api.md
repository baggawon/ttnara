# Chat Server API Specification

This document defines the API contract for the external chat server. The Next.js frontend connects via WebSocket for real-time messaging and uses REST API (proxied through Next.js) for admin operations.

## Architecture

- **WebSocket**: Direct connection from browser to chat server for real-time messaging
- **REST API**: Admin operations proxied through Next.js API layer (handles authentication)
- **Storage**: Messages stored for 24 hours (configurable via `chat_delete_hours`)
- **Rate Limiting**: Spam prevention handled server-side with escalating penalties

---

## Authentication

All connections require a JWT token issued by the Next.js app. The token contains:

```json
{
  "uid": "cuid_string",
  "displayname": "username",
  "rank_level": 1,
  "rank_image": "bronze.png",
  "auth_level": 1,
  "is_app_admin": false
}
```

- **WebSocket**: Token passed as query parameter `?token={jwt}`
- **REST API**: Token passed as `Authorization: Bearer {jwt}` header

---

## WebSocket API

### Connection

```
ws://{chat_server_url}/ws?token={jwt}&topic_id={id}
```

On connect, the server should:
1. Validate the JWT token
2. Check if user is banned → send `error` with code `BANNED`
3. Check if user is muted → send `user_muted` with expiry
4. Send `messages_init` with recent messages for the requested topic
5. Send `user_count` updates
6. Send current `notice_update`
7. Send `message_fixed` if a fixed message exists for the topic

### Client → Server Messages

All messages are JSON with `{ type, payload }` structure.

#### `send_message`

```json
{
  "type": "send_message",
  "payload": {
    "topic_id": 1,
    "content": "Hello world"
  }
}
```

**Server-side validation:**
1. User must be authenticated (`AUTH_REQUIRED`)
2. User auth_level >= `level_chat` setting (`LEVEL_TOO_LOW`)
3. User not banned (`BANNED`)
4. User not muted (`MUTED`)
5. Content length <= `max_chat_length` (`TOO_LONG`)
6. Content doesn't contain banned words (`BANNED_WORD`)
7. Spam check: time since last message >= `spam_frequency_seconds` (`SPAM_WARNING` → `SPAM_PENALTY_1` → `SPAM_PENALTY_2` → `SPAM_PENALTY_3`)

**On success:** Broadcast `message` to all clients in the topic.

#### `switch_topic`

```json
{
  "type": "switch_topic",
  "payload": {
    "topic_id": 2
  }
}
```

**Server-side:** Move user from current topic room to new topic room. Send `messages_init` for the new topic. Update `user_count` for both old and new topics.

---

### Server → Client Messages

#### `message`

New chat message broadcast to all users in the topic.

```json
{
  "type": "message",
  "payload": {
    "id": "msg_uuid",
    "uid": "user_cuid",
    "displayname": "닉네임",
    "rank_level": 3,
    "rank_image": "gold.png",
    "content": "Hello world",
    "topic_id": 1,
    "created_at": "2026-04-03T12:00:00Z"
  }
}
```

#### `messages_init`

Initial batch of messages when connecting or switching topics.

```json
{
  "type": "messages_init",
  "payload": {
    "topic_id": 1,
    "messages": [
      {
        "id": "msg_uuid",
        "uid": "user_cuid",
        "displayname": "닉네임",
        "rank_level": 3,
        "rank_image": "gold.png",
        "content": "Hello",
        "topic_id": 1,
        "created_at": "2026-04-03T12:00:00Z",
        "is_hidden": false
      }
    ]
  }
}
```

#### `message_hidden`

Message hidden by a moderator.

```json
{
  "type": "message_hidden",
  "payload": { "message_id": "msg_uuid" }
}
```

#### `message_fixed` / `message_fixed_removed`

Fixed (pinned) message set or removed for a topic. Only one fixed message per topic.

```json
{
  "type": "message_fixed",
  "payload": { "topic_id": 1, "content": "Important notice" }
}
```

```json
{
  "type": "message_fixed_removed",
  "payload": { "topic_id": 1 }
}
```

#### `user_muted` / `user_unmuted`

Sent to the affected user. Include `is_self: true` so the client knows it applies to them.

```json
{
  "type": "user_muted",
  "payload": { "uid": "user_cuid", "until": "2026-04-03T12:05:00Z", "is_self": true }
}
```

#### `user_banned`

```json
{
  "type": "user_banned",
  "payload": { "uid": "user_cuid", "is_self": true }
}
```

#### `user_count`

Active user count per topic. Broadcast periodically (every 10-30 seconds) or on join/leave.

```json
{
  "type": "user_count",
  "payload": { "topic_id": 1, "count": 42 }
}
```

#### `notice_update`

Sent when admin updates chat notices. Contains full list of active notices.

```json
{
  "type": "notice_update",
  "payload": {
    "notices": [
      { "id": 1, "title": "공지", "content": "Welcome!", "display_order": 1 }
    ]
  }
}
```

#### `error`

```json
{
  "type": "error",
  "payload": { "code": "SPAM_WARNING", "message": "잠시 후 다시 시도하세요." }
}
```

**Error codes:**

| Code | Description | Action |
|------|-------------|--------|
| `SPAM_WARNING` | First spam offence | Show warning toast, 3s wait |
| `SPAM_PENALTY_1` | Second offence | 1 minute cooldown |
| `SPAM_PENALTY_2` | Third offence | 5 minute cooldown |
| `SPAM_PENALTY_3` | Fourth+ offence | 30 minute cooldown |
| `MUTED` | User is muted | Show mute timer |
| `BANNED` | User is banned | Show banned message, disable chat |
| `BANNED_WORD` | Message contains banned word | Show warning |
| `TOO_LONG` | Message exceeds max length | Show warning |
| `AUTH_REQUIRED` | Not authenticated | Prompt login |
| `LEVEL_TOO_LOW` | User level too low | Show requirement |

---

### Spam Prevention Logic

Track per-user message timestamps. On each `send_message`:

1. If last message was < `spam_frequency_seconds` ago:
   - **1st offence**: Send `SPAM_WARNING`, reject message
   - **2nd offence**: Apply `spam_penalty_second` minutes cooldown, send `SPAM_PENALTY_1`
   - **3rd offence**: Apply `spam_penalty_third` minutes cooldown, send `SPAM_PENALTY_2`
   - **4th+ offence**: Apply `spam_penalty_last` minutes cooldown, send `SPAM_PENALTY_3`
2. If user successfully waits the full `spam_frequency_seconds`, reset offence counter to 0

---

## REST API (Admin Operations)

All endpoints require admin authentication (`is_app_admin: true` or `auth_level >= level_moderator`).

### Messages

#### GET `/api/messages`

Get recent messages for a topic.

**Query params:** `topic_id` (required), `limit` (default 100), `offset` (default 0)

**Response:**
```json
{
  "messages": [...],
  "total": 500
}
```

#### POST `/api/messages/hide`

Hide a message from all users.

**Body:** `{ "message_id": "msg_uuid" }`

**Effect:** Broadcast `message_hidden` to all clients in the topic.

#### POST `/api/messages/unhide`

Unhide a previously hidden message.

**Body:** `{ "message_id": "msg_uuid" }`

#### GET `/api/messages/hidden`

List all hidden messages.

**Response:** `{ "messages": [...] }`

#### POST `/api/messages/fix`

Set a fixed (pinned) message for a topic. Replaces any existing fixed message for that topic.

**Body:** `{ "topic_id": 1, "content": "Important message" }`

**Effect:** Broadcast `message_fixed` to all clients in the topic.

#### DELETE `/api/messages/fix`

Remove fixed message for a topic.

**Query params:** `topic_id`

**Effect:** Broadcast `message_fixed_removed`.

### User Moderation

#### POST `/api/users/mute`

Mute a user for a specified duration.

**Body:** `{ "uid": "user_cuid", "minutes": 5 }`

**Effect:** Broadcast `user_muted` to the affected user.

#### POST `/api/users/unmute`

Immediately unmute a user.

**Body:** `{ "uid": "user_cuid" }`

**Effect:** Broadcast `user_unmuted`.

#### GET `/api/users/muted`

List currently muted users.

**Response:**
```json
{
  "users": [
    { "uid": "user_cuid", "displayname": "닉네임", "muted_until": "2026-04-03T12:05:00Z" }
  ]
}
```

#### POST `/api/users/ban`

Ban a user from chat entirely. Banned users cannot see chat content.

**Body:** `{ "uid": "user_cuid" }`

**Effect:** Broadcast `user_banned`, disconnect user.

#### POST `/api/users/unban`

Unban a user.

**Body:** `{ "uid": "user_cuid" }`

#### GET `/api/users/banned` (Next.js handles via DB)

List banned users. This is stored in the Next.js database (`chat_setting.banned_users` relation).

#### POST `/api/users/deactivate`

Deactivate a user's entire platform account (not just chat).

**Body:** `{ "uid": "user_cuid" }`

**Note:** This calls back to the Next.js API to set `user.is_active = false`.

### Topics

#### GET `/api/topics`

List all active chat topics.

**Response:**
```json
{
  "topics": [
    { "id": 1, "name": "P2P거래", "display_order": 1, "is_active": true }
  ]
}
```

### User Count

#### GET `/api/users/count`

Get active user counts per topic.

**Query params:** `topic_id` (optional, omit for all topics)

**Response:**
```json
{
  "counts": { "1": 42, "2": 15 }
}
```

---

## Configuration (from `chat_setting` table)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `chat_server_url` | String | "" | WebSocket server URL |
| `level_moderator` | Int | 5 | auth_level required for moderation |
| `level_chat` | Int | 1 | auth_level required to send messages |
| `max_chat_length` | Int | 50 | Max message character length |
| `max_display_items` | Int | 100 | Max messages shown in chat window |
| `spam_frequency_seconds` | Int | 3 | Min seconds between messages |
| `spam_penalty_second` | Int | 1 | 2nd offence penalty (minutes) |
| `spam_penalty_third` | Int | 5 | 3rd offence penalty (minutes) |
| `spam_penalty_last` | Int | 30 | 4th+ offence penalty (minutes) |
| `chat_delete_hours` | Int | 24 | Message retention period (hours) |

---

## Database Models (managed by Next.js)

These models are in the Next.js Prisma schema. The chat server should read/reference them via shared database or API callbacks.

- `chat_topic` — Chat topic definitions
- `chat_notice` — Carousel notice content
- `chat_fixed_message` — Fixed (pinned) messages per topic
- `chat_banned_word` — List of banned words
- `chat_report` — User-submitted message reports
- `chat_setting` — Global chat configuration + penalty_users/banned_users relations
