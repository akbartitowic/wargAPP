# Warga App — Perencanaan CMS (Command Center)

CMS berbasis **web desktop-first** sebagai pusat kendali bagi Administrator (RT/RW/Estate Management). Frontend CMS proyek ini berada di folder **`/cms`**, memakai **React + Vite + TypeScript + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/)** sebagai design system komponen.

---

## 1. Arsitektur & keamanan CMS

### Role-Based Access Control (RBAC)

| Peran | Ruang lingkup |
|--------|----------------|
| **Super Admin** | Akses penuh seluruh sistem. |
| **Admin Keuangan** | Hanya modul IPL (tagihan, verifikasi, laporan). |
| **Admin Konten** | Hanya Berita & UMKM (konten, persetujuan toko). |

### Audit log

Mencatat setiap aktivitas penting (siapa mengubah data warga, siapa menghapus/menonaktifkan berita, persetujuan pembayaran) untuk akuntabilitas dan kepatuhan.

### Secure session

- Auto-logout setelah **tidak ada aktivitas 30 menit** di dashboard admin (idle timeout).
- Sesi terpisah dari aplikasi warga; token dan refresh policy ditentukan backend.

---

## 2. Modul manajemen user (master data)

Menghubungkan **NIK** dan **No. KK** dengan aturan bisnis aplikasi warga.

### Registrasi user (create)

- **Input:** Nama lengkap, NIK, No. KK, No. HP, alamat (blok/nomor), agama.
- **Validasi:** NIK unik (cek sebelum simpan).
- **Kepala keluarga:** Opsi *“Kepala keluarga / wali”* untuk mengaktifkan akses fitur IPL (`is_parent` di API).

### Update user (edit)

- Perubahan No. HP, alamat, atau status wali (pergantian kepala keluarga).
- **Logika:** Jika status wali dipindahkan dari A ke B dalam satu No. KK, sistem **mencabut akses IPL** pada A dan memberikan ke B (sumber kebenaran backend).

### Delete user (soft delete)

- Status **inactive**, bukan penghapusan fisik (jaga riwayat tagihan).
- **Peringatan:** Jika yang dinonaktifkan adalah kepala keluarga, wajib arahkan admin menunjuk **kepala keluarga baru** untuk No. KK tersebut sebelum menyelesaikan alur.

### Import / export

- Unggah **Excel (.csv / .xlsx)** untuk pendaftaran massal.
- Export data warga untuk backup / analitik (hak akses per RBAC).

---

## 3. Modul manajemen berita

- **Editor:** Rich text (mis. Quill / CKEditor): tebal, list, tautan.
- **Gambar:** Upload hero dengan **auto-crop rasio 16:9** (selaras dengan app warga).
- **Prioritas:** Flag *priority* untuk tampil di hero banner aplikasi (`is_priority`).
- **Kategori:** Pengumuman, Darurat, Kegiatan, Info UMKM, dll.
- **Jadwal terbit:** *Schedule post* untuk publikasi otomatis.

---

## 4. Modul manajemen IPL (billing control)

- **Bill generator:** Satu aksi untuk membuat tagihan IPL bulanan bagi seluruh No. KK aktif.
- **Verifikasi pembayaran:** Antrean bukti unggahan warga; **Approve** (lunas) / **Reject** (notifikasi ke warga, mis. bukti tidak jelas).
- **Laporan keuangan:** Export bulanan (Excel/PDF) — lunas vs menunggak.

---

## 5. Modul UMKM & fasilitas

- **Persetujuan toko:** Review permohonan warga agar toko tampil di menu UMKM.
- **Titik lokasi:** Input **latitude / longitude** untuk tempat ibadah, retail terdekat, agar tombol *Arahkan* di aplikasi akurat.

---

## 6. Tech stack & pola UI CMS

| Lapisan | Pilihan |
|---------|---------|
| Framework | React (Vite + TypeScript) |
| Styling & komponen | Tailwind CSS v4 + **shadcn/ui** |
| Layout | **Sidebar** navigasi modul (Users, Billing, News, UMKM, Lokasi, Pengaturan, Audit) |
| Data | **Server-side pagination** pada tabel besar |
| Pencarian / filter | Blok, No. KK, status IPL (lunas / belum / pending), status warga |

Integrasi API mengikuti kontrak yang sama dengan aplikasi warga (`is_parent`, `billing_status`, `quick_menu_order`, berita `is_priority`, dll.).

---

## Menjalankan proyek CMS (lokal)

```bash
cd cms
npm install
npm run dev
```

Build produksi:

```bash
npm run build
```

Port default Vite: **5173** (sesuaikan jika bentrok dengan app `web`).
