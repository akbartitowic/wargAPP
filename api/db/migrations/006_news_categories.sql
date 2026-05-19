-- Master kategori berita per perumahan (sinkron dengan filter di aplikasi warga)

CREATE TABLE news_categories (
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

CREATE INDEX idx_news_categories_housing ON news_categories (housing_complex_id, sort_order);

ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES news_categories (id);

-- Kategori default untuk setiap perumahan yang sudah ada
INSERT INTO news_categories (housing_complex_id, key, label, sort_order)
SELECT hc.id, v.key, v.label, v.sort_order
FROM housing_complexes hc
CROSS JOIN (
  VALUES
    ('pengumuman', 'Pengumuman', 1),
    ('keamanan', 'Keamanan', 2),
    ('kegiatan', 'Kegiatan', 3),
    ('umkm-info', 'UMKM Info', 4)
) AS v(key, label, sort_order)
ON CONFLICT (housing_complex_id, key) DO NOTHING;

-- Backfill category_id dari kolom category (teks) yang ada
UPDATE news_articles na
SET category_id = nc.id
FROM news_categories nc
WHERE nc.housing_complex_id = na.housing_complex_id
  AND (
    LOWER(TRIM(na.category)) = LOWER(nc.label)
    OR LOWER(TRIM(na.category)) = nc.key
  )
  AND na.category_id IS NULL;

-- Fallback: pengumuman jika belum cocok
UPDATE news_articles na
SET category_id = nc.id
FROM news_categories nc
WHERE nc.housing_complex_id = na.housing_complex_id
  AND nc.key = 'pengumuman'
  AND na.category_id IS NULL;
