# Warga App — REST API

Backend untuk aplikasi warga (PWA/Capacitor) dan CMS Admin.

| Lapisan | Teknologi |
|---------|-----------|
| Runtime | Node.js 20+ |
| Framework | Express 5 + TypeScript |
| Database | PostgreSQL 16 |
| Auth | JWT (Bearer) |
| Validasi | Zod |
| Upload | Multer (bukti transfer) |

## Struktur folder

Clean Architecture (Controller → Service → Repository). Detail lengkap: [`docs/FOLDER-STRUCTURE.md`](../docs/FOLDER-STRUCTURE.md).

```
api/
├── config/          # database, jwt, env
├── controllers/
├── middlewares/     # auth + role gatekeeper
├── models/
├── repositories/
├── services/
├── routes/          # api.ts (warga), admin.ts (CMS)
├── storage/         # upload files
├── server.ts        # entry point
└── db/migrations/
```

## Menjalankan lokal

```bash
# Dari root monorepo
docker compose up -d

cd api
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Base URL: `http://localhost:3000/api/v1`

## Akun testing

Daftar lengkap (URL, wali, anggota, CMS): **[`docs/TEST-ACCOUNTS.md`](../docs/TEST-ACCOUNTS.md)**.

| Peran | Kredensial |
|-------|------------|
| Warga (wali) | NIK `3201010101010001` / `WargaDemo123!` |
| Warga (anggota) | NIK `3201010101010002` / `WargaDemo123!` |
| Admin CMS | `admin@warga.local` / `AdminDemo123!` |

## Kontrak response

```json
{ "status": "success", "data": { } }
{ "status": "error", "message": "...", "errors": [] }
```

## Endpoint ringkas

### Warga (Bearer warga)

| Method | Path | Catatan |
|--------|------|---------|
| POST | `/auth/login` | Public |
| GET | `/profile` | NIK/KK di-mask |
| PUT | `/profile/update` | Hanya foto & HP |
| GET | `/home/config` | Max 4 menu cepat |
| GET | `/billing/current` | Gatekeeper wali + `can_view_billing` |
| GET | `/billing/history` | Idem |
| POST | `/billing/upload-proof` | multipart, max 2MB JPG/PNG |
| GET | `/umkm/shops` | Query: filter, sort, category |
| GET | `/umkm/shops/:id/products` | |
| GET | `/news` | `is_priority` di urutan atas |
| GET | `/news/:slug` | |
| GET | `/religious/schedule` | `?type=` |
| GET | `/religious/places` | |

### Admin CMS (Bearer admin)

| Method | Path | RBAC |
|--------|------|------|
| POST | `/admin/auth/login` | Public |
| POST | `/admin/users` | super_admin |
| PUT | `/admin/users/:id` | super_admin |
| DELETE | `/admin/users/:id` | super_admin (soft delete) |
| POST | `/admin/billing/generate` | super_admin, finance_admin |
| GET | `/admin/billing/approval` | super_admin, finance_admin |
| PUT | `/admin/billing/approve/:id` | super_admin, finance_admin |
| POST | `/admin/news` | super_admin, content_admin |

## Gatekeeper IPL

Middleware `requireBillingAccess` mengecek `is_parent` **dan** `can_view_billing`. Jika gagal → **403** tanpa query ke tabel `billings`.

## HTTP status

| Code | Pemakaian |
|------|-----------|
| 400 | Payload salah |
| 401 | JWT invalid/expired |
| 403 | Anggota keluarga akses IPL |
| 422 | Validasi (Zod / NIK 16 digit) |
| 500 | Server/DB error |

Dokumentasi skema lengkap: [`db/migrations/001_initial_schema.sql`](db/migrations/001_initial_schema.sql)
