/** Chip filter di daftar berita — "Semua" + label dari master kategori API. */
export type NewsFilter = 'Semua' | (string & {})

export type NewsItem = {
  slug: string
  title: string
  excerpt: string
  /** Cuplikan pendek di daftar "Terbaru" */
  listSnippet: string
  imageSrc: string
  publishedAt: string
  filterCategory: string
  /** Pill hijau muda di detail */
  displayTag: string
  /** Pita pojok kiri hero di daftar (mis. PENTING) */
  heroRibbon?: string
  /** Hero banner / sorotan (CMS). */
  is_priority?: boolean
  /** Teks waktu relatif di hero */
  featuredTimeLabel?: string
  /** Baris atas kartu daftar: "5 Jam" */
  listTimeLabel: string
  authorName: string
  authorRole: string
  body: string[]
  bodyImageSrc?: string
  bodyImageCaption?: string
}

export const NEWS_CATEGORY_CHIPS: NewsFilter[] = [
  'Semua',
  'Pengumuman',
  'Keamanan',
  'Kegiatan',
  'UMKM Info',
]

export const NEWS: NewsItem[] = [
  {
    slug: 'perbaikan-saluran-blok-ab',
    title: 'Perbaikan saluran air Blok A dan B akhir pekan ini',
    excerpt:
      'Pekerjaan akan dilakukan pada Sabtu–Minggu. Mohon antisipasi genangan sementara di titik tertentu.',
    listSnippet:
      'Pekerjaan saluran utama cluster A–B dijadwalkan akhir pekan…',
    imageSrc: 'https://picsum.photos/seed/saluranwarga/960/600',
    publishedAt: '2026-05-14T07:00:00+07:00',
    filterCategory: 'Pengumuman',
    displayTag: 'Pengumuman',
    heroRibbon: 'PENTING',
    is_priority: true,
    featuredTimeLabel: '2 jam yang lalu',
    listTimeLabel: '2 jam',
    authorName: 'Admin RW 05',
    authorRole: 'Admin RW 05',
    body: [
      'Pengurus lingkungan menginformasikan jadwal perbaikan saluran air utama di Blok A dan B yang akan dilaksanakan pada akhir pekan ini.',
      'Selama pengerjaan, aliran air sementara dialihkan. Warga dimohon mengurangi pembuangan limbah padat ke saluran agar pekerjaan berjalan lancar.',
      'Apabila terdapat kendala mendesak, silakan hubungi pos jaga atau ketua RT setempat.',
    ],
  },
  {
    slug: 'bazaar-kuliner-warga',
    title: 'Bazaar kuliner warga hadir lagi minggu ini',
    excerpt: 'Aneka jajanan dan produk UMKM sekitar komplek.',
    listSnippet: 'Jangan lewatkan aneka jajanan dar…',
    imageSrc: 'https://picsum.photos/seed/bazaarUMKM/640/640',
    publishedAt: '2026-05-14T04:00:00+07:00',
    filterCategory: 'UMKM Info',
    displayTag: 'UMKM Info',
    listTimeLabel: '5 jam',
    authorName: 'Tim Kegiatan',
    authorRole: 'Panitia UMKM',
    body: [
      'Bazaar kuliner warga kembali dibuka minggu ini dengan konsep ramah lingkungan dan tanpa plastik sekali pakai.',
      'Stan dapat didaftarkan melalui pengurus RW hingga hari Kamis.',
    ],
  },
  {
    slug: 'evaluasi-keamanan-gerbang-utama',
    title: 'Evaluasi sistem keamanan gerbang utama',
    excerpt: 'Rapat bulanan RT/RW membahas hasil evaluasi CCTV dan akses.',
    listSnippet: 'Hasil rapat bulanan RT/RW…',
    imageSrc: 'https://picsum.photos/seed/rapatkeamanan/640/640',
    publishedAt: '2026-05-13T10:00:00+07:00',
    filterCategory: 'Keamanan',
    displayTag: 'Keamanan',
    listTimeLabel: '1 hari',
    authorName: 'Satgas Keamanan',
    authorRole: 'Tim Keamanan RW',
    body: [
      'Rutinitas evaluasi perangkat di gerbang utama telah dilaksanakan dengan melibatkan perwakilan warga.',
      'Beberapa rekomendasi perbaikan akan dijabarkan dalam undangan tindak lanjut.',
    ],
  },
  {
    slug: 'kerja-bakti-minggu-ini',
    title: 'Jadwal kerja bakti rutin bulan ini',
    excerpt: 'Kerja bakti rutin menjaga kebersihan lingkungan.',
    listSnippet: 'Mari bersama menjaga kebersihan…',
    imageSrc: 'https://picsum.photos/seed/warga1/800/480',
    publishedAt: '2026-05-12T08:00:00+07:00',
    filterCategory: 'Kegiatan',
    displayTag: 'Kegiatan',
    listTimeLabel: '2 hari',
    authorName: 'Pengurus Lingkungan',
    authorRole: 'Tim Kegiatan RW',
    body: [
      'Dewan pengurus lingkungan mengundang seluruh warga untuk ikut kerja bakti rutin minggu ini.',
      'Titik kumpul di pos keamanan pukul 07:30 WIB. Perlengkapan sederhana dibawa masing-masing.',
    ],
  },
  {
    slug: 'pembaruan-cctv',
    title: 'Pembaruan sistem keamanan CCTV',
    excerpt:
      'Pemasangan titik baru di gerbang utama dan area parkir kendaraan.',
    listSnippet: 'Pemasangan 5 titik CCTV baru di gerbang…',
    imageSrc: 'https://picsum.photos/seed/cctv/800/480',
    publishedAt: '2026-05-11T15:00:00+07:00',
    filterCategory: 'Keamanan',
    displayTag: 'Keamanan',
    listTimeLabel: '3 hari',
    authorName: 'Tim Keamanan',
    authorRole: 'Admin RW 05',
    body: [
      'Tim keamanan lingkungan melakukan upgrade perangkat perekaman di titik strategis.',
      'Warga dapat melaporkan gangguan kamera ke pos jaga selama 24 jam.',
    ],
  },
  {
    slug: 'perbaikan-taman-bermain-anak',
    title: 'Perbaikan fasilitas taman bermain anak di sektor utara',
    excerpt:
      'Renovasi peralatan permainan dan area rubberized untuk keselamatan.',
    listSnippet:
      'Penggantian komponen ayunan dan perbaikan lantai area bermain…',
    imageSrc: 'https://picsum.photos/seed/tamanbermain/960/540',
    publishedAt: '2023-10-12T09:00:00+07:00',
    filterCategory: 'Pengumuman',
    displayTag: 'Pengumuman',
    listTimeLabel: '2 hari',
    authorName: 'Admin RW 05',
    authorRole: 'Admin RW 05',
    body: [
      'Pengurus wilayah menginformasikan rencana perbaikan fasilitas taman bermain anak di sektor utara komplek perumahan.',
      'Kegiatan akan dilaksanakan bertahap agar tidak mengganggu aktivitas warga di jam sibuk. Area akan dibatasi sementara dengan rambu keselamatan.',
      'Warga yang memiliki masukan terkait desain atau prioritas peralatan dapat menyampaikannya melalui kanal resmi RW hingga akhir minggu ini.',
      'Terima kasih atas partisipasi dan pengertian seluruh warga.',
    ],
    bodyImageSrc: 'https://picsum.photos/seed/desaintaman/960/400',
    bodyImageCaption: 'Desain rencana perbaikan area bermain.',
  },
]

export function getNewsBySlug(slug: string | undefined): NewsItem | undefined {
  if (!slug) return undefined
  return NEWS.find((n) => n.slug === slug)
}

export function getRelatedNews(slug: string, limit = 2): NewsItem[] {
  return NEWS.filter((n) => n.slug !== slug).slice(0, limit)
}

/** Hero: berita prioritas terbaru (boleh beberapa `is_priority`; ambil paling baru). */
export function getPriorityHeroNews(): NewsItem | undefined {
  const list = NEWS.filter((n) => n.is_priority)
  if (list.length === 0) return undefined
  return [...list].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )[0]
}

/** @deprecated gunakan getPriorityHeroNews */
export function getFeaturedNews(): NewsItem | undefined {
  return getPriorityHeroNews()
}

export function getNewsFeedItems(): NewsItem[] {
  const hero = getPriorityHeroNews()
  return NEWS.filter((n) => n.slug !== hero?.slug).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

/** Kartu kedua di beranda: entri terbaru setelah hero. */
export function getHomeSecondaryNews(): NewsItem | undefined {
  return getNewsFeedItems()[0]
}
