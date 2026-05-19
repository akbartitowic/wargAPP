-- Alamat terstruktur: wilayah di perumahan, detail unit di warga

ALTER TABLE housing_complexes
  ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(80),
  ADD COLUMN IF NOT EXISTS kelurahan VARCHAR(80),
  ADD COLUMN IF NOT EXISTS kode_pos VARCHAR(10);

UPDATE housing_complexes
SET
  kecamatan = COALESCE(NULLIF(kecamatan, ''), 'Kecamatan Contoh'),
  kelurahan = COALESCE(NULLIF(kelurahan, ''), 'Kelurahan Contoh'),
  kode_pos = COALESCE(NULLIF(kode_pos, ''), '12345')
WHERE kecamatan IS NULL OR kelurahan IS NULL OR kode_pos IS NULL;

ALTER TABLE housing_complexes
  ALTER COLUMN kecamatan SET NOT NULL,
  ALTER COLUMN kelurahan SET NOT NULL,
  ALTER COLUMN kode_pos SET NOT NULL;

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS nama_jalan VARCHAR(120),
  ADD COLUMN IF NOT EXISTS rt VARCHAR(5),
  ADD COLUMN IF NOT EXISTS rw VARCHAR(5);

UPDATE residents
SET
  nama_jalan = COALESCE(NULLIF(nama_jalan, ''), 'Jl. Contoh'),
  rt = COALESCE(NULLIF(rt, ''), '01'),
  rw = COALESCE(NULLIF(rw, ''), '02')
WHERE nama_jalan IS NULL OR rt IS NULL OR rw IS NULL;

ALTER TABLE residents
  ALTER COLUMN nama_jalan SET NOT NULL,
  ALTER COLUMN rt SET NOT NULL,
  ALTER COLUMN rw SET NOT NULL;
