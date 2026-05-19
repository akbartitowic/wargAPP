-- Warga App API — PostgreSQL DDL (v1)
-- Jalankan: psql $DATABASE_URL -f db/migrations/001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM ───────────────────────────────────────────────────────────────────

CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE religion_type AS ENUM (
  'Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya'
);
CREATE TYPE billing_status AS ENUM ('unpaid', 'pending', 'paid');
CREATE TYPE payment_proof_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE admin_role AS ENUM ('super_admin', 'finance_admin', 'content_admin');
CREATE TYPE umkm_shop_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');
CREATE TYPE news_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE worship_schedule_type AS ENUM ('sholat', 'misa', 'puja', 'lainnya');

-- ─── ADMIN (CMS) ────────────────────────────────────────────────────────────

CREATE TABLE admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  role          admin_role NOT NULL DEFAULT 'content_admin',
  status        user_status NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── WARGA ──────────────────────────────────────────────────────────────────

CREATE TABLE residents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nik               CHAR(16) NOT NULL UNIQUE,
  no_kk             CHAR(16) NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  nama              VARCHAR(120) NOT NULL,
  no_hp             VARCHAR(20) NOT NULL,
  blok_rumah        VARCHAR(32) NOT NULL,
  agama             religion_type NOT NULL DEFAULT 'Islam',
  foto_profil_url   TEXT,
  is_parent         BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_billing  BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_umkm   BOOLEAN NOT NULL DEFAULT FALSE,
  status            user_status NOT NULL DEFAULT 'active',
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_resident_nik_len CHECK (char_length(nik) = 16),
  CONSTRAINT chk_resident_kk_len CHECK (char_length(no_kk) = 16)
);

CREATE INDEX idx_residents_no_kk ON residents (no_kk) WHERE status = 'active';
CREATE INDEX idx_residents_no_hp ON residents (no_hp) WHERE status = 'active';

-- Satu wali aktif per No. KK (partial unique)
CREATE UNIQUE INDEX uq_one_parent_per_kk
  ON residents (no_kk)
  WHERE is_parent = TRUE AND status = 'active';

-- ─── HOME QUICK MENU (CMS config) ───────────────────────────────────────────

CREATE TABLE home_menu_items (
  id          SERIAL PRIMARY KEY,
  menu_key    VARCHAR(32) NOT NULL UNIQUE,
  label       VARCHAR(64) NOT NULL,
  icon        VARCHAR(64) NOT NULL,
  route_path  VARCHAR(128) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── IPL BILLING ────────────────────────────────────────────────────────────

CREATE TABLE billing_periods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_year  SMALLINT NOT NULL,
  period_month SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  label        VARCHAR(64) NOT NULL,
  due_date     DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (period_year, period_month)
);

CREATE TABLE billings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_kk        CHAR(16) NOT NULL,
  period_id    UUID NOT NULL REFERENCES billing_periods (id),
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status       billing_status NOT NULL DEFAULT 'unpaid',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (no_kk, period_id)
);

CREATE INDEX idx_billings_no_kk ON billings (no_kk);

CREATE TABLE billing_line_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id  UUID NOT NULL REFERENCES billings (id) ON DELETE CASCADE,
  item_name   VARCHAR(80) NOT NULL,
  amount      NUMERIC(14, 2) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE payment_proofs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id   UUID NOT NULL REFERENCES billings (id),
  resident_id  UUID NOT NULL REFERENCES residents (id),
  file_path    TEXT NOT NULL,
  mime_type    VARCHAR(32) NOT NULL,
  file_size    INT NOT NULL,
  status       payment_proof_status NOT NULL DEFAULT 'pending',
  reviewed_by  UUID REFERENCES admins (id),
  reviewed_at  TIMESTAMPTZ,
  reject_note  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_proofs_status ON payment_proofs (status) WHERE status = 'pending';

-- ─── UMKM ───────────────────────────────────────────────────────────────────

CREATE TABLE umkm_shops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES residents (id),
  name          VARCHAR(120) NOT NULL,
  category      VARCHAR(40) NOT NULL,
  tagline       TEXT,
  description   TEXT,
  image_url     TEXT,
  rating        NUMERIC(3, 2) NOT NULL DEFAULT 0,
  open_time     TIME NOT NULL,
  close_time    TIME NOT NULL,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  whatsapp      VARCHAR(32),
  status        umkm_shop_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE umkm_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES umkm_shops (id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  price       NUMERIC(14, 2) NOT NULL,
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── BERITA ─────────────────────────────────────────────────────────────────

CREATE TABLE news_articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(180) NOT NULL UNIQUE,
  title         VARCHAR(200) NOT NULL,
  excerpt       TEXT NOT NULL,
  body_html     TEXT NOT NULL,
  image_url     TEXT,
  category      VARCHAR(40) NOT NULL DEFAULT 'Pengumuman',
  is_priority   BOOLEAN NOT NULL DEFAULT FALSE,
  author_name   VARCHAR(80),
  author_role   VARCHAR(80),
  status        news_status NOT NULL DEFAULT 'draft',
  published_at  TIMESTAMPTZ,
  scheduled_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES admins (id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_news_published ON news_articles (published_at DESC)
  WHERE status = 'published';

-- ─── IBADAH ─────────────────────────────────────────────────────────────────

CREATE TABLE worship_places (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL,
  place_type  VARCHAR(40) NOT NULL,
  address     TEXT,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  religions   religion_type[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE worship_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id    UUID NOT NULL REFERENCES worship_places (id) ON DELETE CASCADE,
  schedule_type worship_schedule_type NOT NULL DEFAULT 'sholat',
  label       VARCHAR(80) NOT NULL,
  event_time  TIME NOT NULL,
  day_of_week SMALLINT CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6),
  religions   religion_type[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── AUDIT LOG ──────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  actor_type  VARCHAR(16) NOT NULL,
  actor_id    UUID NOT NULL,
  action      VARCHAR(64) NOT NULL,
  entity_type VARCHAR(40),
  entity_id   UUID,
  payload     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);

-- ─── REFRESH TOKENS (opsional) ──────────────────────────────────────────────

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type VARCHAR(16) NOT NULL,
  subject_id  UUID NOT NULL,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
