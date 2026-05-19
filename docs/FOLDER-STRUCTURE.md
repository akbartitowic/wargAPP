# Struktur Folder Warga App

Pemetaan spesifikasi arsitektur ke monorepo aktual.

| Spesifikasi | Folder proyek |
|-------------|----------------|
| `backend-warga-api/` | [`api/`](../api/) |
| `frontend-warga-app/` | [`web/`](../web/) |
| CMS Admin | [`cms/`](../cms/) |

---

## 1. Backend — Clean Architecture

```
api/
├── config/                  # DB, JWT, env
│   ├── database.ts          # Pool PostgreSQL + query()
│   ├── env.ts
│   └── jwt.ts
├── controllers/             # HTTP request/response, validasi payload
│   ├── auth.controller.ts
│   ├── billing.controller.ts
│   ├── news.controller.ts
│   ├── umkm.controller.ts
│   └── admin.controller.ts
├── middlewares/             # Gatekeeper keamanan
│   ├── authMiddleware.ts    # JWT warga & admin
│   ├── roleMiddleware.ts    # is_parent, can_view_billing, RBAC
│   ├── upload.ts
│   └── newsUpload.ts
├── models/                  # Mapping entitas DB
│   ├── user.model.ts
│   ├── family.model.ts
│   └── iplBill.model.ts
├── repositories/            # Kueri database
│   ├── user.repository.ts
│   └── billing.repository.ts
├── services/                # Logika bisnis
│   ├── billing.service.ts
│   ├── umkm.service.ts
│   └── admin.service.ts
├── routes/
│   ├── api.ts               # Route aplikasi warga
│   ├── admin.ts             # Route CMS
│   └── index.ts
├── storage/                 # Bukti transfer & gambar berita
├── validators/
├── utils/
├── app.ts
└── server.ts                # Entry point (npm run dev)
```

**Alur request:** `routes` → `middlewares` → `controllers` → `services` → `repositories` → PostgreSQL

---

## 2. Frontend — Feature-Based (PWA + Capacitor)

```
web/
├── android/                 # Capacitor Android
├── ios/
├── public/                  # PWA manifest, SW (via Vite PWA)
├── src/
│   ├── assets/
│   ├── components/          # Global: Button, Card, BottomNav, AppShell
│   ├── config/
│   │   └── api/             # client.ts, endpoints.ts
│   ├── features/
│   │   ├── auth/            # Login, AuthGuard
│   │   ├── dashboard/       # Home, HomeWidgets
│   │   ├── ipl/             # Tagihan, BillingRouteGuard
│   │   ├── news/
│   │   ├── umkm/
│   │   ├── worship/
│   │   └── profile/
│   ├── store/               # Zustand: sessionStore, authStore
│   ├── hooks/
│   ├── lib/
│   ├── pages/               # Lapor, Informasi (belum di-feature-kan)
│   ├── index.css
│   ├── App.tsx
│   └── main.tsx
└── capacitor.config.ts
```

---

## Menjalankan

```bash
docker compose up -d
cd api && npm run dev          # server.ts :3000
cd web && npm run dev          # :5173
cd cms && npm run dev -- --port 5174
```

Akun testing: [`TEST-ACCOUNTS.md`](TEST-ACCOUNTS.md)
