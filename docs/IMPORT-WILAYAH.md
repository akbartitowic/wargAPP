# Import Data Wilayah (Production)

Panduan mengisi referensi wilayah administrasi Indonesia ke database WargAPP.

Sumber data:

- [cahyadsn/wilayah](https://github.com/cahyadsn/wilayah) — provinsi hingga kelurahan/desa
- [cahyadsn/wilayah_kodepos](https://github.com/cahyadsn/wilayah_kodepos) — kode pos per kelurahan

Proyek ini sudah menyediakan skrip otomatis di `api/scripts/import-wilayah.ts`. Anda **tidak wajib** clone repo GitHub secara manual, kecuali server tidak bisa mengakses internet.

---

## Prasyarat

1. **Migrasi database sudah dijalankan** (termasuk tabel `wilayah` dan `wilayah_kodepos` dari `005_wilayah_ref.sql`):

   ```bash
   cd api
   npm run db:migrate
   ```

   Verifikasi di PostgreSQL:

   ```sql
   SELECT name FROM schema_migrations WHERE name LIKE '%005%';
   ```

2. **File `api/.env`** berisi `DATABASE_URL` yang mengarah ke database production.

3. **Server punya akses internet** ke `raw.githubusercontent.com` (untuk unduh file SQL), atau siapkan file SQL secara manual (lihat [Alternatif: unduh manual](#alternatif-unduh-manual)).

4. **Dependensi Node terpasang**:

   ```bash
   cd api
   npm ci
   ```

---

## Cara import (disarankan)

Jalankan dari folder `api`:

```bash
cd api
npm run db:import:wilayah
```

### Apa yang dilakukan skrip?

| Langkah | Keterangan |
|--------|------------|
| 1 | Mengunduh `wilayah.sql` dari GitHub (jika belum ada di `api/data/wilayah/`) |
| 2 | Mengunduh `wilayah_kodepos.sql` dari repo kodepos |
| 3 | Mengisi tabel `wilayah` (provinsi → kelurahan/desa) |
| 4 | Mengisi tabel `wilayah_kodepos` |
| 5 | (Opsional) Menautkan perumahan demo `perumahan-demo` ke satu kelurahan contoh |

### Contoh output sukses

```text
Mengunduh https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql …
Wilayah: xxxxx baris
  … 5000 / xxxxx
Kodepos: xxxxx baris
Import wilayah selesai.
```

---

## Verifikasi

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM wilayah;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM wilayah_kodepos;"
psql "$DATABASE_URL" -c "SELECT kode, nama, level FROM wilayah WHERE level = 1 LIMIT 5;"
```

### Level wilayah

| `level` | Jenis |
|--------|--------|
| 1 | Provinsi |
| 2 | Kabupaten / Kota |
| 3 | Kecamatan |
| 4 | Kelurahan / Desa |

---

## Import ulang (data salah atau tidak lengkap)

Skrip **melewati import** jika tabel sudah berisi data (`COUNT(*) > 0`).

Untuk mengosongkan dan mengimpor dari awal:

```sql
TRUNCATE wilayah_kodepos, wilayah RESTART IDENTITY CASCADE;
```

```bash
cd api
npm run db:import:wilayah
```

> **Peringatan:** `TRUNCATE` menghapus semua data wilayah. Pastikan tidak ada dampak pada `housing_complexes.kelurahan_kode` atau data produksi lain yang sudah memakai kode wilayah.

---

## Alternatif: unduh manual

Jika server production **tidak bisa** mengakses GitHub, unduh di mesin lain lalu upload ke server.

```bash
mkdir -p api/data/wilayah

curl -o api/data/wilayah/wilayah.sql \
  https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql

curl -o api/data/wilayah/wilayah_kodepos.sql \
  https://raw.githubusercontent.com/cahyadsn/wilayah_kodepos/master/db/wilayah_kodepos.sql
```

Upload folder `api/data/wilayah/` ke server, lalu:

```bash
cd api
npm run db:import:wilayah
```

Skrip tidak mengunduh ulang jika file sudah ada di disk.

---

## Troubleshooting

| Masalah | Solusi |
|--------|--------|
| `relation "wilayah" does not exist` | Jalankan `npm run db:migrate` terlebih dahulu |
| `Gagal unduh ...` (403, timeout) | Cek firewall/proxy; gunakan [unduh manual](#alternatif-unduh-manual) |
| Pesan `lewati impor wilayah` / `lewati impor kodepos` | Tabel tidak kosong — gunakan `TRUNCATE` jika perlu import ulang |
| Error koneksi database | Periksa `DATABASE_URL` di `api/.env` |
| Proses berjalan lama | Normal; kodepos bisa puluhan ribu baris (±5–15 menit) |

---

## Setelah import

- Form alamat di **CMS** (picker provinsi / kabupaten / kecamatan / kelurahan) memakai data dari tabel `wilayah`.
- **Tidak perlu** restart API khusus untuk import ini; data langsung tersimpan di PostgreSQL.

---

## Ringkasan perintah (production)

```bash
cd /path/to/wargAPP/api
# Pastikan .env & migrate OK
npm run db:migrate
npm run db:import:wilayah
```
