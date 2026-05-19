-- Warga kontrak wajib terhubung ke pemilik (parent)

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS owner_resident_id UUID REFERENCES residents (id);

CREATE INDEX IF NOT EXISTS idx_residents_owner_parent
  ON residents (owner_resident_id)
  WHERE owner_resident_id IS NOT NULL;

ALTER TABLE residents
  DROP CONSTRAINT IF EXISTS chk_pemilik_no_owner;

ALTER TABLE residents
  ADD CONSTRAINT chk_pemilik_no_owner
  CHECK (
    occupancy_type <> 'pemilik'::resident_occupancy_type
    OR owner_resident_id IS NULL
  );

ALTER TABLE residents
  DROP CONSTRAINT IF EXISTS chk_kontrak_has_owner;

ALTER TABLE residents
  ADD CONSTRAINT chk_kontrak_has_owner
  CHECK (
    occupancy_type <> 'kontrak'::resident_occupancy_type
    OR owner_resident_id IS NOT NULL
  );
