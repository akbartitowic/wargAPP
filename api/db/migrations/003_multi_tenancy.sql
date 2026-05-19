-- Multi-tenancy: satu aplikasi untuk banyak perumahan
-- Jalankan setelah 001 (npm run db:migrate)

CREATE TABLE IF NOT EXISTS schema_migrations (
  name        VARCHAR(128) PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PERUMAHAN ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS housing_complexes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(64) NOT NULL UNIQUE,
  name        VARCHAR(120) NOT NULL,
  address     TEXT,
  status      user_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DEFAULT PERUMAHAN (data lama) ───────────────────────────────────────────

INSERT INTO housing_complexes (id, slug, name, address)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'perumahan-demo',
  'Perumahan Demo RT',
  'Jl. Contoh No. 1'
)
ON CONFLICT (slug) DO NOTHING;

-- ─── ADMINS ──────────────────────────────────────────────────────────────────

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS housing_complex_id UUID REFERENCES housing_complexes (id);

UPDATE admins
SET housing_complex_id = 'a0000000-0000-4000-8000-000000000001'
WHERE role <> 'super_admin' AND housing_complex_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_one_housing_admin_per_complex
  ON admins (housing_complex_id)
  WHERE role = 'housing_admin' AND status = 'active' AND housing_complex_id IS NOT NULL;

-- ─── WARGA ───────────────────────────────────────────────────────────────────

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS housing_complex_id UUID REFERENCES housing_complexes (id);

UPDATE residents
SET housing_complex_id = 'a0000000-0000-4000-8000-000000000001'
WHERE housing_complex_id IS NULL;

ALTER TABLE residents
  ALTER COLUMN housing_complex_id SET NOT NULL;

ALTER TABLE residents DROP CONSTRAINT IF EXISTS residents_nik_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_residents_housing_nik
  ON residents (housing_complex_id, nik);

DROP INDEX IF EXISTS uq_one_parent_per_kk;
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_parent_per_kk_housing
  ON residents (housing_complex_id, no_kk)
  WHERE is_parent = TRUE AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_residents_housing
  ON residents (housing_complex_id) WHERE status = 'active';

-- ─── HOME MENU ───────────────────────────────────────────────────────────────

ALTER TABLE home_menu_items
  ADD COLUMN IF NOT EXISTS housing_complex_id UUID REFERENCES housing_complexes (id);

UPDATE home_menu_items
SET housing_complex_id = 'a0000000-0000-4000-8000-000000000001'
WHERE housing_complex_id IS NULL;

ALTER TABLE home_menu_items
  ALTER COLUMN housing_complex_id SET NOT NULL;

ALTER TABLE home_menu_items DROP CONSTRAINT IF EXISTS home_menu_items_menu_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_home_menu_housing_key
  ON home_menu_items (housing_complex_id, menu_key);

-- ─── BILLING ─────────────────────────────────────────────────────────────────

ALTER TABLE billing_periods
  ADD COLUMN IF NOT EXISTS housing_complex_id UUID REFERENCES housing_complexes (id);

UPDATE billing_periods
SET housing_complex_id = 'a0000000-0000-4000-8000-000000000001'
WHERE housing_complex_id IS NULL;

ALTER TABLE billing_periods
  ALTER COLUMN housing_complex_id SET NOT NULL;

ALTER TABLE billing_periods DROP CONSTRAINT IF EXISTS billing_periods_period_year_period_month_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_period_housing
  ON billing_periods (housing_complex_id, period_year, period_month);

ALTER TABLE billings
  ADD COLUMN IF NOT EXISTS housing_complex_id UUID REFERENCES housing_complexes (id);

UPDATE billings b
SET housing_complex_id = COALESCE(
  (SELECT r.housing_complex_id FROM residents r WHERE r.no_kk = b.no_kk LIMIT 1),
  'a0000000-0000-4000-8000-000000000001'::uuid
)
WHERE b.housing_complex_id IS NULL;

ALTER TABLE billings
  ALTER COLUMN housing_complex_id SET NOT NULL;

ALTER TABLE billings DROP CONSTRAINT IF EXISTS billings_no_kk_period_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_billings_housing_kk_period
  ON billings (housing_complex_id, no_kk, period_id);

-- ─── BERITA ──────────────────────────────────────────────────────────────────

ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS housing_complex_id UUID REFERENCES housing_complexes (id);

UPDATE news_articles
SET housing_complex_id = 'a0000000-0000-4000-8000-000000000001'
WHERE housing_complex_id IS NULL;

ALTER TABLE news_articles
  ALTER COLUMN housing_complex_id SET NOT NULL;

ALTER TABLE news_articles DROP CONSTRAINT IF EXISTS news_articles_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_news_housing_slug
  ON news_articles (housing_complex_id, slug);

-- ─── UMKM ────────────────────────────────────────────────────────────────────

ALTER TABLE umkm_shops
  ADD COLUMN IF NOT EXISTS housing_complex_id UUID REFERENCES housing_complexes (id);

UPDATE umkm_shops
SET housing_complex_id = 'a0000000-0000-4000-8000-000000000001'
WHERE housing_complex_id IS NULL;

-- nullable OK for shops without owner migration

-- ─── IBADAH ──────────────────────────────────────────────────────────────────

ALTER TABLE worship_places
  ADD COLUMN IF NOT EXISTS housing_complex_id UUID REFERENCES housing_complexes (id);

UPDATE worship_places
SET housing_complex_id = 'a0000000-0000-4000-8000-000000000001'
WHERE housing_complex_id IS NULL;
