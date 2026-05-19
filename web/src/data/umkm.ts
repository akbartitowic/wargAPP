export type UmkmCategoryFilter = 'Semua' | 'Makanan' | 'Jasa' | 'Kebutuhan'

export type UmkmStore = {
  id: string
  name: string
  /** Untuk chip filter */
  filterCategory: Exclude<UmkmCategoryFilter, 'Semua'>
  /** Baris meta: jarak + jenis (contoh: "200m • Makanan & Minuman") */
  detailLine: string
  distanceKm: number
  imageSrc: string
  tagline: string
  rating: number
  /** Jam operasional (Asia/Jakarta), format HH:mm */
  openTime: string
  closeTime: string
  latitude: number
  longitude: number
  /** Tautan wa.me (tanpa spasi) */
  whatsappHref: string
  /** Deskripsi panjang di halaman toko */
  storeDescription?: string
  /** Kartu penjual di detail produk */
  sellerCardTitle?: string
  sellerCardLocation?: string
}

export const UMKM_CATEGORY_CHIPS: UmkmCategoryFilter[] = [
  'Semua',
  'Makanan',
  'Jasa',
  'Kebutuhan',
]

export const UMKM_STORES: UmkmStore[] = [
  {
    id: 'kopi-tetangga-blok-b',
    name: 'Kopi Tetangga Blok B',
    filterCategory: 'Makanan',
    detailLine: '200m • Makanan & Minuman',
    distanceKm: 0.2,
    imageSrc: 'https://picsum.photos/seed/kopiUMKM/800/520',
    tagline: 'Kopi susu dan pastry segar.',
    rating: 4.8,
    openTime: '07:00',
    closeTime: '21:00',
    latitude: -6.2615,
    longitude: 106.7829,
    whatsappHref: 'https://wa.me/6281234567890?text=Halo%2C%20saya%20pesan%20dari%20Warga%20App',
    storeDescription:
      'Kopi artisan terbaik di komplek, sedia biji kopi segar dan minuman dingin.',
    sellerCardTitle: 'Kedai Kopi Warga',
    sellerCardLocation: 'Blok B-4',
  },
  {
    id: 'warung-melati',
    name: 'Warung Melati',
    filterCategory: 'Kebutuhan',
    detailLine: '350m • Sembako & kebutuhan harian',
    distanceKm: 0.35,
    imageSrc: 'https://picsum.photos/seed/warungUMKM/800/520',
    tagline: 'Beras lokal & kebutuhan harian.',
    rating: 4.5,
    openTime: '06:00',
    closeTime: '20:00',
    latitude: -6.2625,
    longitude: 106.7845,
    whatsappHref: 'https://wa.me/6281234567891?text=Halo%2C%20saya%20pesan%20dari%20Warga%20App',
  },
  {
    id: 'laundry-sejahtera',
    name: 'Laundry Sejahtera',
    filterCategory: 'Jasa',
    detailLine: '500m • Jasa cuci & setrika',
    distanceKm: 0.5,
    imageSrc: 'https://picsum.photos/seed/laundryUMKM/800/520',
    tagline: 'Cuci kering kilat 1 hari.',
    rating: 4.6,
    openTime: '08:00',
    closeTime: '18:00',
    latitude: -6.264,
    longitude: 106.788,
    whatsappHref: 'https://wa.me/6281234567892?text=Halo%2C%20saya%20pesan%20dari%20Warga%20App',
  },
]
