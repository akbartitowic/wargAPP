-- Referensi wilayah administrasi (sumber: cahyadsn/wilayah, MIT)
-- Kode pos per kelurahan/desa (sumber: cahyadsn/wilayah_kodepos)

CREATE TABLE IF NOT EXISTS wilayah (
  kode VARCHAR(13) PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 4),
  parent_kode VARCHAR(13) REFERENCES wilayah (kode) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wilayah_parent ON wilayah (parent_kode);
CREATE INDEX IF NOT EXISTS idx_wilayah_level ON wilayah (level);
CREATE INDEX IF NOT EXISTS idx_wilayah_nama_lower ON wilayah (LOWER(nama));

CREATE TABLE IF NOT EXISTS wilayah_kodepos (
  kode VARCHAR(13) PRIMARY KEY REFERENCES wilayah (kode) ON DELETE CASCADE,
  kodepos VARCHAR(5) NOT NULL
);

ALTER TABLE housing_complexes
  ADD COLUMN IF NOT EXISTS kelurahan_kode VARCHAR(13) REFERENCES wilayah (kode);

CREATE INDEX IF NOT EXISTS idx_housing_kelurahan_kode ON housing_complexes (kelurahan_kode);
