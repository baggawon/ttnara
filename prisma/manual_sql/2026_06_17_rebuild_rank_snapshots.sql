-- Rebuilds the denormalized per-user rank snapshots (profile.current_rank_* and
-- profile.current_board_rank_*) from the current trade_rank / board_rank tables
-- and each user's trade_count / point.
--
-- One-time cleanup for the "ghost badge" bug: snapshots were only refreshed when
-- a user traded or earned points, so admin changes to the rank STRUCTURE (batch
-- replace, create, update) left users displaying names/badges of ranks that no
-- longer exist. The app now re-derives snapshots on every rank mutation; this
-- script clears the backlog of already-stale rows. Idempotent — safe to re-run.
--
-- Apply with one of:
--   psql "$DATABASE_URL" -f prisma/manual_sql/2026_06_17_rebuild_rank_snapshots.sql
--   npx prisma db execute --file prisma/manual_sql/2026_06_17_rebuild_rank_snapshots.sql --schema prisma/schema.prisma
--
-- search_path covers both deployments: prod tables live in "Platypus", test in
-- public. A non-existent schema in the list is skipped, so this is safe on both.
SET search_path TO "Platypus", public;

-- Trade rank: threshold is user.trade_count (lives on "user"), so join through it.
-- Pick the highest active tier the user still meets; no match -> level 1, null badge.
UPDATE profile p
SET current_rank_level = COALESCE((
      SELECT tr.rank_level FROM trade_rank tr
      WHERE tr.is_active AND tr.min_trade_count <= u.trade_count
      ORDER BY tr.min_trade_count DESC LIMIT 1), 1),
    current_rank_name = (
      SELECT tr.name FROM trade_rank tr
      WHERE tr.is_active AND tr.min_trade_count <= u.trade_count
      ORDER BY tr.min_trade_count DESC LIMIT 1),
    current_rank_image = (
      SELECT tr.badge_image FROM trade_rank tr
      WHERE tr.is_active AND tr.min_trade_count <= u.trade_count
      ORDER BY tr.min_trade_count DESC LIMIT 1),
    updated_at = NOW()
FROM "user" u
WHERE p.uid = u.id;

-- Board rank: threshold is profile.point (lives on profile), so correlate on p.
UPDATE profile p
SET current_board_rank_level = COALESCE((
      SELECT br.rank_level FROM board_rank br
      WHERE br.is_active AND br.min_point <= p.point
      ORDER BY br.min_point DESC LIMIT 1), 1),
    current_board_rank_name = (
      SELECT br.name FROM board_rank br
      WHERE br.is_active AND br.min_point <= p.point
      ORDER BY br.min_point DESC LIMIT 1),
    current_board_rank_image = (
      SELECT br.badge_image FROM board_rank br
      WHERE br.is_active AND br.min_point <= p.point
      ORDER BY br.min_point DESC LIMIT 1),
    updated_at = NOW();
