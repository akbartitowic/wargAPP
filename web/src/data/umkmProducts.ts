export type UmkmProduct = {
  slug: string
  storeId: string
  name: string
  price: number
  imageSrc: string
  rating: number
  isBestseller?: boolean
  description: string
}

export const UMKM_PRODUCTS: UmkmProduct[] = [
  {
    slug: 'es-kopi-susu-tetangga',
    storeId: 'kopi-tetangga-blok-b',
    name: 'Es Kopi Susu Tetangga',
    price: 18_000,
    imageSrc: 'https://picsum.photos/seed/prodkopi1/600/600',
    rating: 4.8,
    isBestseller: true,
    description:
      'Perpaduan espresso lokal dengan susu segar, sirup gula aren homemade, dan es batu serut. Cocok dinikmati di siang hari.',
  },
  {
    slug: 'kopi-tubruk-klasik',
    storeId: 'kopi-tetangga-blok-b',
    name: 'Kopi Tubruk Klasik',
    price: 12_000,
    imageSrc: 'https://picsum.photos/seed/prodkopi2/600/600',
    rating: 4.6,
    description:
      'Biji robusta pilihan diseduh tradisional dengan gula pasir secukupnya. Rasa kuat dan hangat.',
  },
  {
    slug: 'croissant-butter',
    storeId: 'kopi-tetangga-blok-b',
    name: 'Croissant Mentega',
    price: 22_000,
    imageSrc: 'https://picsum.photos/seed/prodcroissant/600/600',
    rating: 4.7,
    description: 'Lapisan renyah dengan mentega Eropa, dipanggang setiap pagi.',
  },
  {
    slug: 'matcha-latte-dingin',
    storeId: 'kopi-tetangga-blok-b',
    name: 'Matcha Latte Dingin',
    price: 24_000,
    imageSrc: 'https://picsum.photos/seed/prodmatcha/600/600',
    rating: 4.5,
    description: 'Matcha premium whisk dengan susu oat dan sedikit madu.',
  },
  {
    slug: 'beras-5kg',
    storeId: 'warung-melati',
    name: 'Beras Premium 5 kg',
    price: 85_000,
    imageSrc: 'https://picsum.photos/seed/prodberas/600/600',
    rating: 4.9,
    description: 'Beras lokal sortiran terbaik, kemasan kedap udara.',
  },
  {
    slug: 'cuci-setrika-3kg',
    storeId: 'laundry-sejahtera',
    name: 'Paket Cuci Setrika 3 kg',
    price: 45_000,
    imageSrc: 'https://picsum.photos/seed/prodlaundry/600/600',
    rating: 4.4,
    description: 'Cuci, kering, setrika — selesai dalam satu hari kerja.',
  },
]

export function getProductsByStoreId(storeId: string): UmkmProduct[] {
  return UMKM_PRODUCTS.filter((p) => p.storeId === storeId)
}

export function getProductBySlug(
  storeId: string | undefined,
  productSlug: string | undefined,
): UmkmProduct | undefined {
  if (!storeId || !productSlug) return undefined
  return UMKM_PRODUCTS.find(
    (p) => p.storeId === storeId && p.slug === productSlug,
  )
}

/** Set / timpa parameter `text` pada URL wa.me */
export function waUrlSetText(baseHref: string, text: string): string {
  try {
    const u = new URL(baseHref)
    u.searchParams.set('text', text)
    return u.toString()
  } catch {
    return `${baseHref}${baseHref.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`
  }
}

export function productOrderMessage(productName: string): string {
  return `Halo, saya pesan "${productName}" lewat Warga App.`
}
