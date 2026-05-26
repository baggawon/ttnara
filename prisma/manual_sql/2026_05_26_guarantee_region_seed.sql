-- Seeds guarantee_region with the 17 hardcoded values from the former
-- GuaranteeRegion enum so the admin-managed list ships non-empty.
-- Idempotent via ON CONFLICT (name).
-- Apply with one of:
--   psql "$DATABASE_URL" -f prisma/manual_sql/2026_05_26_guarantee_region_seed.sql
--   npx prisma db execute --file prisma/manual_sql/2026_05_26_guarantee_region_seed.sql --schema prisma/schema.prisma

INSERT INTO "Platypus"."guarantee_region" (name, display_order, is_active, created_at, updated_at) VALUES
  ('서울특별시',       1,  true, NOW(), NOW()),
  ('부산광역시',       2,  true, NOW(), NOW()),
  ('대구광역시',       3,  true, NOW(), NOW()),
  ('인천광역시',       4,  true, NOW(), NOW()),
  ('광주광역시',       5,  true, NOW(), NOW()),
  ('대전광역시',       6,  true, NOW(), NOW()),
  ('울산광역시',       7,  true, NOW(), NOW()),
  ('세종특별자치시',   8,  true, NOW(), NOW()),
  ('경기도',           9,  true, NOW(), NOW()),
  ('강원특별자치도',   10, true, NOW(), NOW()),
  ('충청북도',         11, true, NOW(), NOW()),
  ('충청남도',         12, true, NOW(), NOW()),
  ('전북특별자치도',   13, true, NOW(), NOW()),
  ('전라남도',         14, true, NOW(), NOW()),
  ('경상북도',         15, true, NOW(), NOW()),
  ('경상남도',         16, true, NOW(), NOW()),
  ('제주특별자치도',   17, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
