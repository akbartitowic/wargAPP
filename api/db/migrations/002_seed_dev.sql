-- Data contoh pengembangan lokal
-- Password semua akun demo: WargaDemo123!

INSERT INTO home_menu_items (menu_key, label, icon, route_path, sort_order) VALUES
  ('ipl', 'Tagihan IPL', 'receipt', '/ipl', 1),
  ('umkm', 'Toko Terdekat', 'store', '/umkm', 2),
  ('jadwal_ibadah', 'Jadwal Ibadah', 'calendar', '/ibadah/jadwal', 3),
  ('lokasi_ibadah', 'Tempat ibadah', 'map-pin', '/ibadah/lokasi', 4),
  ('retail', 'Retail', 'shopping-bag', '/umkm', 5),
  ('lapor', 'Lapor', 'alert-circle', '/lapor', 6),
  ('informasi', 'Informasi', 'info', '/informasi', 7)
ON CONFLICT (menu_key) DO NOTHING;

-- Admin & warga demo diisi oleh: npm run db:seed
