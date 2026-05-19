-- Tagihan IPL per alamat (unit), bukan per KK

CREATE TABLE IF NOT EXISTS housing_units (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_complex_id  UUID NOT NULL REFERENCES housing_complexes (id),
  nama_jalan          VARCHAR(120) NOT NULL,
  blok_rumah          VARCHAR(32) NOT NULL,
  rt                  VARCHAR(5) NOT NULL,
  rw                  VARCHAR(5) NOT NULL,
  allows_multiple_kk  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_housing_unit_address
  ON housing_units (
    housing_complex_id,
    lower(trim(nama_jalan)),
    lower(trim(blok_rumah)),
    rt,
    rw
  );

CREATE INDEX IF NOT EXISTS idx_housing_units_complex
  ON housing_units (housing_complex_id);

INSERT INTO housing_units (housing_complex_id, nama_jalan, blok_rumah, rt, rw, allows_multiple_kk)
SELECT DISTINCT
  r.housing_complex_id,
  trim(r.nama_jalan),
  trim(r.blok_rumah),
  trim(r.rt),
  trim(r.rw),
  FALSE
FROM residents r
WHERE r.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM housing_units u
    WHERE u.housing_complex_id = r.housing_complex_id
      AND lower(trim(u.nama_jalan)) = lower(trim(r.nama_jalan))
      AND lower(trim(u.blok_rumah)) = lower(trim(r.blok_rumah))
      AND u.rt = trim(r.rt)
      AND u.rw = trim(r.rw)
  );

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS housing_unit_id UUID REFERENCES housing_units (id);

UPDATE residents r
SET housing_unit_id = u.id
FROM housing_units u
WHERE r.housing_unit_id IS NULL
  AND r.housing_complex_id = u.housing_complex_id
  AND lower(trim(r.nama_jalan)) = lower(trim(u.nama_jalan))
  AND lower(trim(r.blok_rumah)) = lower(trim(u.blok_rumah))
  AND trim(r.rt) = u.rt
  AND trim(r.rw) = u.rw;

UPDATE housing_units u
SET allows_multiple_kk = TRUE
WHERE id IN (
  SELECT housing_unit_id
  FROM residents
  WHERE housing_unit_id IS NOT NULL AND deleted_at IS NULL
  GROUP BY housing_unit_id
  HAVING COUNT(DISTINCT no_kk) > 1
);

ALTER TABLE billings
  ADD COLUMN IF NOT EXISTS housing_unit_id UUID REFERENCES housing_units (id);

UPDATE billings b
SET housing_unit_id = sub.housing_unit_id
FROM (
  SELECT DISTINCT ON (b2.id)
    b2.id AS billing_id,
    r.housing_unit_id
  FROM billings b2
  JOIN residents r
    ON r.housing_complex_id = b2.housing_complex_id
   AND r.no_kk = b2.no_kk
   AND r.housing_unit_id IS NOT NULL
   AND r.deleted_at IS NULL
  ORDER BY b2.id, r.is_parent DESC, r.created_at
) sub
WHERE b.id = sub.billing_id AND b.housing_unit_id IS NULL;

-- Satu tagihan per alamat per periode (gabung duplikat lama)
DELETE FROM billing_line_items
WHERE billing_id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY housing_complex_id, housing_unit_id, period_id
        ORDER BY
          CASE status WHEN 'paid' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
          updated_at DESC
      ) AS rn
    FROM billings
    WHERE housing_unit_id IS NOT NULL
  ) dup WHERE rn > 1
);

DELETE FROM payment_proofs
WHERE billing_id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY housing_complex_id, housing_unit_id, period_id
        ORDER BY
          CASE status WHEN 'paid' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
          updated_at DESC
      ) AS rn
    FROM billings
    WHERE housing_unit_id IS NOT NULL
  ) dup WHERE rn > 1
);

DELETE FROM billings
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY housing_complex_id, housing_unit_id, period_id
        ORDER BY
          CASE status WHEN 'paid' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
          updated_at DESC
      ) AS rn
    FROM billings
    WHERE housing_unit_id IS NOT NULL
  ) dup WHERE rn > 1
);

DROP INDEX IF EXISTS uq_billings_housing_kk_period;

CREATE UNIQUE INDEX IF NOT EXISTS uq_billings_housing_unit_period
  ON billings (housing_complex_id, housing_unit_id, period_id)
  WHERE housing_unit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_residents_housing_unit
  ON residents (housing_unit_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_billings_housing_unit
  ON billings (housing_unit_id);
