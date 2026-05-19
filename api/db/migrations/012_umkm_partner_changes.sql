-- Mitra UMKM: tutup manual + pengajuan perubahan (disetujui via CMS)

ALTER TABLE umkm_shops
  ADD COLUMN IF NOT EXISTS is_manual_closed BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
  CREATE TYPE umkm_change_request_type AS ENUM (
    'shop_update',
    'product_create',
    'product_update',
    'product_delete'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE umkm_change_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS umkm_change_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID NOT NULL REFERENCES umkm_shops (id) ON DELETE CASCADE,
  resident_id  UUID NOT NULL REFERENCES residents (id),
  request_type umkm_change_request_type NOT NULL,
  product_id   UUID REFERENCES umkm_products (id) ON DELETE SET NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  status       umkm_change_request_status NOT NULL DEFAULT 'pending',
  reject_note  TEXT,
  reviewed_by  UUID REFERENCES admins (id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_umkm_change_requests_pending
  ON umkm_change_requests (shop_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_umkm_change_requests_shop_created
  ON umkm_change_requests (shop_id, created_at DESC);
