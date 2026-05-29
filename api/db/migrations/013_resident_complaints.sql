-- Komplain warga: master kategori, tiket, lampiran, riwayat status

DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM (
    'submitted',
    'in_review',
    'in_progress',
    'closed',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS complaint_categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_complex_id  UUID NOT NULL REFERENCES housing_complexes (id) ON DELETE CASCADE,
  key                 VARCHAR(40) NOT NULL,
  label               VARCHAR(80) NOT NULL,
  sort_order          SMALLINT NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (housing_complex_id, key)
);

CREATE INDEX IF NOT EXISTS idx_complaint_categories_housing
  ON complaint_categories (housing_complex_id, sort_order);

CREATE TABLE IF NOT EXISTS resident_complaints (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_complex_id  UUID NOT NULL REFERENCES housing_complexes (id) ON DELETE CASCADE,
  resident_id         UUID NOT NULL REFERENCES residents (id) ON DELETE CASCADE,
  category_id         UUID NOT NULL REFERENCES complaint_categories (id),
  description         TEXT NOT NULL,
  status              complaint_status NOT NULL DEFAULT 'submitted',
  admin_note          TEXT,
  reviewed_by         UUID REFERENCES admins (id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resident_complaints_housing_status
  ON resident_complaints (housing_complex_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resident_complaints_resident
  ON resident_complaints (resident_id, created_at DESC);

CREATE TABLE IF NOT EXISTS complaint_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID NOT NULL REFERENCES resident_complaints (id) ON DELETE CASCADE,
  file_path     TEXT NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  file_size     INTEGER NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_attachments_complaint
  ON complaint_attachments (complaint_id, sort_order);

CREATE TABLE IF NOT EXISTS complaint_status_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID NOT NULL REFERENCES resident_complaints (id) ON DELETE CASCADE,
  status        complaint_status NOT NULL,
  note          TEXT,
  changed_by    UUID REFERENCES admins (id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_status_logs_complaint
  ON complaint_status_logs (complaint_id, created_at ASC);

-- Kategori default per perumahan
INSERT INTO complaint_categories (housing_complex_id, key, label, sort_order)
SELECT hc.id, v.key, v.label, v.sort_order
FROM housing_complexes hc
CROSS JOIN (
  VALUES
    ('keamanan', 'Keamanan', 1),
    ('kebersihan', 'Kebersihan', 2),
    ('infrastruktur', 'Infrastruktur', 3),
    ('fasilitas', 'Fasilitas umum', 4),
    ('lainnya', 'Lainnya', 5)
) AS v(key, label, sort_order)
ON CONFLICT (housing_complex_id, key) DO NOTHING;
