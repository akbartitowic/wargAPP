# Akun testing (development)

**Hanya untuk lingkungan lokal / staging.** Jangan dipakai di production. Password di bawah di-set oleh `npm run db:seed` di folder `api/`.

## Aplikasi warga (PWA)

| | |
|---|---|
| **URL** | http://localhost:5173 |
| **Login** | Halaman `/login` |
| **Identifier** | NIK **atau** No. HP |
| **Password** | `WargaDemo123!` |

### Wali (kepala keluarga — akses tagihan IPL)

| Field | Nilai |
|-------|--------|
| NIK | `3201010101010001` |
| No. HP | `081234567890` |

### Anggota keluarga (tanpa akses IPL)

| Field | Nilai |
|-------|--------|
| NIK | `3201010101010002` |
| No. HP | `081234567891` |

---

## CMS Admin

| | |
|---|---|
| **URL** | http://localhost:5174 (atau port Vite CMS) |
| **Login** | `/login` |
| **Password** | `AdminDemo123!` |

### Super admin (semua perumahan)

| Field | Nilai |
|-------|--------|
| Email | `admin@warga.local` |
| Peran | `super_admin` |
| CMS | Menu **Perumahan** → `/housing` (CRUD tenant) |

### Admin perumahan (satu perumahan penuh)

| Field | Nilai |
|-------|--------|
| Email | `rt@perumahan-demo.local` |
| Peran | `housing_admin` |
| Perumahan | Perumahan Demo RT |

---

## Multi-perumahan

- Setiap **warga** terikat `housing_complex_id` (data IPL, berita, UMKM, ibadah hanya dari perumahannya).
- **Admin perumahan** (`housing_admin`) hanya mengelola satu perumahan.
- **Super admin** mengelola semua perumahan; di CMS wajib pilih perumahan saat tambah warga / generate tagihan.

Migrasi DB yang sudah ada:

```bash
cd api && npx tsx scripts/migrate-003.ts && npm run db:seed
```

---

## API & database

| | |
|---|---|
| **API base** | http://localhost:3000/api/v1 |
| **Health** | http://localhost:3000/health |
| **Postgres** | `postgresql://warga:warga_dev@localhost:5433/wargapp` |

```bash
# Dari root monorepo
docker compose up -d
cd api && npm run db:seed   # ulang data demo
cd api && npm run dev
```

---

## Env frontend

```bash
# web/.env dan cms/.env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```
