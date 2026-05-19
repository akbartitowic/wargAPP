-- Fasilitas umum per perumahan (menggantikan tempat ibadah di app warga)

CREATE TABLE IF NOT EXISTS public_facilities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_complex_id  UUID NOT NULL REFERENCES housing_complexes (id),
  name                VARCHAR(120) NOT NULL,
  facility_type       VARCHAR(40) NOT NULL,
  description         TEXT,
  image_url           TEXT,
  address             TEXT,
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,
  open_time           TIME,
  close_time          TIME,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_facilities_complex
  ON public_facilities (housing_complex_id)
  WHERE is_active = TRUE;

-- Migrasi data tempat ibadah lama (jika ada)
INSERT INTO public_facilities (
  housing_complex_id, name, facility_type, description, address,
  latitude, longitude, open_time, close_time, is_active, sort_order
)
SELECT
  wp.housing_complex_id,
  wp.name,
  CASE wp.place_type
    WHEN 'masjid' THEN 'Masjid'
    WHEN 'mushola' THEN 'Mushola'
    ELSE 'Tempat ibadah'
  END,
  wp.address,
  wp.address,
  wp.latitude,
  wp.longitude,
  NULL,
  NULL,
  wp.is_active,
  0
FROM worship_places wp
WHERE wp.housing_complex_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public_facilities f
    WHERE f.housing_complex_id = wp.housing_complex_id
      AND lower(f.name) = lower(wp.name)
  );

-- Menu cepat: nonaktifkan jadwal ibadah, ganti lokasi ibadah → fasilitas umum
UPDATE home_menu_items
SET is_active = FALSE, updated_at = NOW()
WHERE menu_key = 'jadwal_ibadah';

UPDATE home_menu_items
SET
  menu_key = 'fasilitas_umum',
  label = 'Fasilitas umum',
  icon = 'building-2',
  route_path = '/fasilitas',
  sort_order = COALESCE(sort_order, 4),
  is_active = TRUE,
  updated_at = NOW()
WHERE menu_key = 'lokasi_ibadah';

INSERT INTO home_menu_items (housing_complex_id, menu_key, label, icon, route_path, sort_order, is_active)
SELECT hc.id, 'fasilitas_umum', 'Fasilitas umum', 'building-2', '/fasilitas', 4, TRUE
FROM housing_complexes hc
WHERE NOT EXISTS (
  SELECT 1 FROM home_menu_items m
  WHERE m.housing_complex_id = hc.id AND m.menu_key = 'fasilitas_umum'
);
