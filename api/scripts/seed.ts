import bcrypt from 'bcrypt'
import 'dotenv/config'
import { pool } from '../src/config/database.js'

const DEMO_HOUSING_ID = 'a0000000-0000-4000-8000-000000000001'
const SHOP_KOPI_ID = 'b1000000-0000-4000-8000-000000000001'
const SHOP_WARUNG_ID = 'b1000000-0000-4000-8000-000000000002'
const MASJID_ID = 'c1000000-0000-4000-8000-000000000001'

async function main() {
  const wargaHash = await bcrypt.hash('WargaDemo123!', 10)
  const adminHash = await bcrypt.hash('AdminDemo123!', 10)

  await pool.query(
    `INSERT INTO housing_complexes (id, slug, name, address, kecamatan, kelurahan, kode_pos)
     VALUES ($1, 'perumahan-demo', 'Perumahan Demo RT', 'Jl. Contoh No. 1',
             'Menteng', 'Menteng', '10310')
     ON CONFLICT (slug) DO UPDATE SET
       kecamatan = EXCLUDED.kecamatan,
       kelurahan = EXCLUDED.kelurahan,
       kode_pos = EXCLUDED.kode_pos`,
    [DEMO_HOUSING_ID],
  )

  await pool.query(
    `INSERT INTO home_menu_items (housing_complex_id, menu_key, label, icon, route_path, sort_order) VALUES
      ($1, 'ipl', 'Tagihan IPL', 'receipt', '/ipl', 1),
      ($1, 'umkm', 'Toko Terdekat', 'store', '/umkm', 2),
      ($1, 'jadwal_ibadah', 'Jadwal Ibadah', 'calendar', '/ibadah/jadwal', 3),
      ($1, 'lokasi_ibadah', 'Tempat ibadah', 'map-pin', '/ibadah/lokasi', 4),
      ($1, 'retail', 'Retail', 'shopping-bag', '/umkm', 5),
      ($1, 'lapor', 'Lapor', 'alert-circle', '/lapor', 6),
      ($1, 'informasi', 'Informasi', 'info', '/informasi', 7)
     ON CONFLICT (housing_complex_id, menu_key) DO NOTHING`,
    [DEMO_HOUSING_ID],
  )

  await pool.query(
    `INSERT INTO residents (
       housing_complex_id, nik, no_kk, password_hash, nama, no_hp,
       nama_jalan, blok_rumah, rt, rw, agama,
       is_parent, can_view_billing, can_manage_umkm,
       residence_start_date
     ) VALUES (
       $1, '3201010101010001', '3201010101011002', $2,
       'Akbar Tito Wicaksono', '081234567890',
       'Jl. Melati Indah', 'A-12', '01', '02', 'Islam',
       TRUE, TRUE, FALSE,
       '2024-01-01'::date
     )
     ON CONFLICT (housing_complex_id, nik) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       residence_start_date = LEAST(
         residents.residence_start_date,
         EXCLUDED.residence_start_date
       )`,
    [DEMO_HOUSING_ID, wargaHash],
  )

  await pool.query(
    `INSERT INTO residents (
       housing_complex_id, nik, no_kk, password_hash, nama, no_hp,
       nama_jalan, blok_rumah, rt, rw, agama,
       is_parent, can_view_billing, can_manage_umkm,
       residence_start_date
     ) VALUES (
       $1, '3201010101010002', '3201010101011002', $2,
       'Ibu Sari Wicaksono', '081234567891',
       'Jl. Melati Indah', 'A-12', '01', '02', 'Islam',
       FALSE, FALSE, FALSE,
       '2024-01-01'::date
     )
     ON CONFLICT (housing_complex_id, nik) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       residence_start_date = LEAST(
         residents.residence_start_date,
         EXCLUDED.residence_start_date
       )`,
    [DEMO_HOUSING_ID, wargaHash],
  )

  await pool.query(
    `UPDATE residents r
     SET housing_unit_id = u.id
     FROM housing_units u
     WHERE r.housing_complex_id = $1
       AND r.housing_unit_id IS NULL
       AND u.housing_complex_id = r.housing_complex_id
       AND lower(trim(u.nama_jalan)) = lower(trim(r.nama_jalan))
       AND lower(trim(u.blok_rumah)) = lower(trim(r.blok_rumah))
       AND u.rt = trim(r.rt)
       AND u.rw = trim(r.rw)`,
    [DEMO_HOUSING_ID],
  )

  await pool.query(
    `INSERT INTO admins (email, password_hash, full_name, role, housing_complex_id)
     VALUES ('admin@warga.local', $1, 'Super Admin', 'super_admin', NULL)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'super_admin', housing_complex_id = NULL`,
    [adminHash],
  )

  await pool.query(
    `INSERT INTO admins (email, password_hash, full_name, role, housing_complex_id)
     VALUES ('rt@perumahan-demo.local', $1, 'Admin Perumahan Demo', 'housing_admin', $2)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'housing_admin',
       housing_complex_id = EXCLUDED.housing_complex_id`,
    [adminHash, DEMO_HOUSING_ID],
  )

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  await pool.query(
    `INSERT INTO billing_periods (housing_complex_id, period_year, period_month, label, due_date)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (housing_complex_id, period_year, period_month) DO NOTHING`,
    [DEMO_HOUSING_ID, year, month, `TAGIHAN ${month}/${year}`, `${year}-${String(month).padStart(2, '0')}-10`],
  )

  const { rows: period } = await pool.query<{ id: string }>(
    `SELECT id FROM billing_periods
     WHERE housing_complex_id = $1 AND period_year = $2 AND period_month = $3`,
    [DEMO_HOUSING_ID, year, month],
  )
  if (period[0]) {
    await pool.query(
      `INSERT INTO billings (housing_complex_id, housing_unit_id, no_kk, period_id, total_amount, status)
       SELECT $1, r.housing_unit_id, r.no_kk, $2, 250000, 'unpaid'
       FROM residents r
       WHERE r.housing_complex_id = $1 AND r.nik = '3201010101010001' AND r.housing_unit_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM billings b
           WHERE b.housing_complex_id = $1
             AND b.housing_unit_id = r.housing_unit_id
             AND b.period_id = $2
         )`,
      [DEMO_HOUSING_ID, period[0].id],
    )
    const { rows: bill } = await pool.query<{ id: string }>(
      `SELECT b.id FROM billings b
       JOIN residents r ON r.housing_unit_id = b.housing_unit_id
       WHERE b.housing_complex_id = $1 AND b.period_id = $2 AND r.nik = '3201010101010001'
       LIMIT 1`,
      [DEMO_HOUSING_ID, period[0].id],
    )
    if (bill[0]) {
      const { rows: cnt } = await pool.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM billing_line_items WHERE billing_id = $1`,
        [bill[0].id],
      )
      if ((cnt[0]?.n ?? 0) === 0) {
        await pool.query(
          `INSERT INTO billing_line_items (billing_id, item_name, amount, sort_order) VALUES
           ($1, 'Keamanan', 100000, 1), ($1, 'Kebersihan', 100000, 2), ($1, 'Kas RT', 50000, 3)`,
          [bill[0].id],
        )
      }
    }
  }

  await pool.query(
    `INSERT INTO news_articles (
       housing_complex_id, slug, title, excerpt, body_html, category, category_id, is_priority,
       status, published_at, author_name, author_role
     ) SELECT
       $1, 'perbaikan-saluran-blok-ab',
       'Perbaikan saluran air Blok A dan B akhir pekan ini',
       'Pekerjaan perbaikan saluran air akan dilakukan pada akhir pekan. Mohon kendaraan tidak parkir di area kerja.',
       '<p>Pekerjaan dimulai Sabtu pagi. Estimasi selesai 2 hari.</p>',
       'Pengumuman', nc.id, TRUE, 'published', NOW(), 'Pengurus RT', 'Admin Konten'
     FROM news_categories nc
     WHERE nc.housing_complex_id = $1 AND nc.key = 'pengumuman'
     ON CONFLICT (housing_complex_id, slug) DO NOTHING`,
    [DEMO_HOUSING_ID],
  )

  await pool.query(
    `INSERT INTO news_articles (
       housing_complex_id, slug, title, excerpt, body_html, category, category_id, is_priority,
       status, published_at, author_name, author_role
     ) SELECT
       $1, 'bazaar-umkm-akhir-bulan',
       'Bazaar UMKM warga akhir bulan',
       'Toko warga buka stand di area taman. Dukung produk lokal perumahan.',
       '<p>Bazaar berlangsung 09.00–15.00 WIB di taman utama.</p>',
       'UMKM Info', nc.id, FALSE, 'published', NOW() - INTERVAL '1 day',
       'Pengurus RT', 'Admin Konten'
     FROM news_categories nc
     WHERE nc.housing_complex_id = $1 AND nc.key = 'umkm-info'
     ON CONFLICT (housing_complex_id, slug) DO NOTHING`,
    [DEMO_HOUSING_ID],
  )

  await pool.query(
    `INSERT INTO news_articles (
       housing_complex_id, slug, title, excerpt, body_html, category, category_id, is_priority,
       status, published_at, author_name, author_role
     ) SELECT
       $1, 'patroli-keamanan-malam',
       'Patroli keamanan malam diperketat',
       'Satpam menambah ronda malam hingga akhir bulan. Laporkan aktivitas mencurigakan ke pengurus.',
       '<p>Hubungi pos keamanan atau pengurus RT untuk keadaan darurat.</p>',
       'Keamanan', nc.id, FALSE, 'published', NOW() - INTERVAL '2 days',
       'Satpam', 'Keamanan'
     FROM news_categories nc
     WHERE nc.housing_complex_id = $1 AND nc.key = 'keamanan'
     ON CONFLICT (housing_complex_id, slug) DO NOTHING`,
    [DEMO_HOUSING_ID],
  )

  const { rows: ownerRows } = await pool.query<{ id: string }>(
    `SELECT id FROM residents
     WHERE housing_complex_id = $1 AND nik = '3201010101010001' LIMIT 1`,
    [DEMO_HOUSING_ID],
  )
  const ownerId = ownerRows[0]?.id ?? null

  await pool.query(
    `INSERT INTO umkm_shops (
       id, housing_complex_id, owner_id, name, category, tagline, description,
       rating, open_time, close_time, latitude, longitude, whatsapp, status
     ) VALUES
       ($2, $1, $3, 'Kopi Tetangga', 'Makanan', 'Kopi & camilan rumahan',
        'Kopi susu, roti, dan camilan untuk warga perumahan.',
        4.6, '07:00', '21:00', -6.2088, 106.8456, '6281234567890', 'approved'),
       ($4, $1, $3, 'Warung Bu Sari', 'Kebutuhan', 'Sembako & kebutuhan harian',
        'Beras, minyak, telur, dan kebutuhan dapur harian.',
        4.4, '08:00', '20:00', -6.2092, 106.8461, '6281234567891', 'approved')
     ON CONFLICT (id) DO UPDATE SET status = 'approved', housing_complex_id = EXCLUDED.housing_complex_id`,
    [DEMO_HOUSING_ID, SHOP_KOPI_ID, ownerId, SHOP_WARUNG_ID],
  )

  await pool.query(
    `INSERT INTO umkm_products (id, shop_id, name, description, price, sort_order) VALUES
       ('d1000000-0000-4000-8000-000000000001', $1, 'Kopi Susu', 'Kopi susu gula aren', 15000, 1),
       ('d1000000-0000-4000-8000-000000000002', $1, 'Roti Bakar', 'Roti bakar keju', 12000, 2),
       ('d1000000-0000-4000-8000-000000000003', $2, 'Beras 5 kg', 'Beras premium lokal', 75000, 1),
       ('d1000000-0000-4000-8000-000000000004', $2, 'Telur 1 kg', 'Telur ayam negeri', 28000, 2)
     ON CONFLICT (id) DO NOTHING`,
    [SHOP_KOPI_ID, SHOP_WARUNG_ID],
  )

  await pool.query(
    `INSERT INTO worship_places (
       id, housing_complex_id, name, place_type, address, latitude, longitude, religions
     ) VALUES (
       $2, $1, 'Masjid Al-Ikhlas', 'masjid',
       'Jl. Melati Indah, area tengah perumahan', -6.2090, 106.8458,
       ARRAY['Islam']::religion_type[]
     )
     ON CONFLICT (id) DO UPDATE SET is_active = TRUE, housing_complex_id = EXCLUDED.housing_complex_id`,
    [DEMO_HOUSING_ID, MASJID_ID],
  )

  await pool.query(
    `DELETE FROM worship_schedules WHERE place_id = $1`,
    [MASJID_ID],
  )
  await pool.query(
    `INSERT INTO worship_schedules (place_id, schedule_type, label, event_time, religions) VALUES
       ($1, 'sholat', 'Subuh', '05:00', ARRAY['Islam']::religion_type[]),
       ($1, 'sholat', 'Dzuhur', '12:10', ARRAY['Islam']::religion_type[]),
       ($1, 'sholat', 'Ashar', '15:30', ARRAY['Islam']::religion_type[]),
       ($1, 'sholat', 'Maghrib', '18:05', ARRAY['Islam']::religion_type[]),
       ($1, 'sholat', 'Isya', '19:30', ARRAY['Islam']::religion_type[])`,
    [MASJID_ID],
  )

  console.log('Seed selesai.')
  console.log('Warga: NIK 3201010101010001 / WargaDemo123!')
  console.log('Super admin: admin@warga.local / AdminDemo123!')
  console.log('Admin perumahan: rt@perumahan-demo.local / AdminDemo123!')
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
