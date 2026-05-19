-- Status hunian warga: pemilik / kontrak + periode tinggal

CREATE TYPE resident_occupancy_type AS ENUM ('pemilik', 'kontrak');

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS occupancy_type resident_occupancy_type NOT NULL DEFAULT 'pemilik',
  ADD COLUMN IF NOT EXISTS residence_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS residence_end_date DATE;

UPDATE residents
SET residence_start_date = created_at::date
WHERE residence_start_date IS NULL;

ALTER TABLE residents
  DROP CONSTRAINT IF EXISTS chk_kontrak_end_date;

ALTER TABLE residents
  ADD CONSTRAINT chk_kontrak_end_date
  CHECK (
    occupancy_type = 'pemilik'::resident_occupancy_type
    OR residence_end_date IS NOT NULL
  );

ALTER TABLE residents
  DROP CONSTRAINT IF EXISTS chk_residence_dates;

ALTER TABLE residents
  ADD CONSTRAINT chk_residence_dates
  CHECK (
    residence_end_date IS NULL
    OR residence_end_date >= residence_start_date
  );
