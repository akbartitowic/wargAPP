import {
  ArrowLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { LazyImage } from '@/components/ui/LazyImage'
import { getProductBySlug, waUrlSetText } from '@/data/umkmProducts'
import { isApiConfigured } from '@/config/api/client'
import { useUmkmProducts } from '@/hooks/useUmkmProducts'
import { useUmkmShops } from '@/hooks/useUmkmShops'
import { formatIDR } from '@/lib/format'
import { buildMarketplaceWaMessage } from '@/lib/waOrder'
import { openExternalUrl } from '@/lib/openExternal'
import { isStoreOpenNow } from '@/lib/umkmHours'
import { useSessionStore } from '@/store/sessionStore'

export function UmkmProductPage() {
  const { storeId, productSlug } = useParams()
  const { stores, loading: loadingStores } = useUmkmShops()
  const store = stores.find((s) => s.id === storeId)
  const { products, loading: loadingProducts } = useUmkmProducts(storeId)
  const apiProduct = products.find(
    (p) => p.slug === productSlug || p.id === productSlug,
  )
  const staticProduct =
    !isApiConfigured() ? getProductBySlug(storeId, productSlug) : undefined
  const product = apiProduct
    ? {
        name: apiProduct.name,
        price: apiProduct.price,
        imageSrc: apiProduct.imageSrc,
        description: apiProduct.description,
        rating: 4.5,
        isBestseller: false,
      }
    : staticProduct
  const [favorite, setFavorite] = useState(false)

  const full_name = useSessionStore((s) => s.full_name)
  const block = useSessionStore((s) => s.block)

  if (loadingStores || loadingProducts) {
    return (
      <div className="min-h-full bg-page-grey px-4 py-12 text-center">
        <p className="text-muted">Memuat…</p>
      </div>
    )
  }

  if (!store || !product) {
    return (
      <div className="min-h-full bg-page-grey px-4 py-12 text-center">
        <p className="text-muted">Produk tidak ditemukan.</p>
        <ButtonLink
          to={storeId ? `/umkm/${storeId}` : '/umkm'}
          variant="secondary"
          className="mt-4 inline-flex"
        >
          Kembali
        </ButtonLink>
      </div>
    )
  }

  const waOrder = waUrlSetText(
    store.whatsappHref,
    buildMarketplaceWaMessage(store.name, full_name, block, product.name),
  )

  const sellerTitle = store.sellerCardTitle ?? store.name
  const sellerLoc =
    store.sellerCardLocation ?? store.detailLine.split('•')[0]?.trim() ?? ''
  const sellerInitial = sellerTitle.charAt(0).toUpperCase()
  const storeOpen = isStoreOpenNow(store.openTime, store.closeTime)

  return (
    <div className="min-h-full bg-page-grey pb-40 text-left">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-royal px-2 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] text-white shadow-md">
        <Link
          to={`/umkm/${store.id}`}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
          aria-label="Kembali ke toko"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <h1 className="text-sm font-bold tracking-wide">Detail produk</h1>
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
          aria-pressed={favorite}
          aria-label={favorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          onClick={() => setFavorite((v) => !v)}
        >
          <Heart
            className={`h-5 w-5 text-white ${favorite ? 'fill-white' : ''}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </header>

      <div className="relative">
        <LazyImage
          src={product.imageSrc}
          alt=""
          className="aspect-square w-full max-h-[min(100vw,28rem)] object-cover"
        />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-royal shadow">
          <Star
            className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            aria-hidden
          />
          {product.rating.toFixed(1)}
        </span>
      </div>

      <div className="relative z-10 -mt-4 px-4">
        <div className="rounded-2xl border border-royal/10 bg-surface p-5 shadow-[0_8px_28px_rgba(0,35,102,0.08)]">
          <h2 className="text-xl font-bold leading-tight text-royal">
            {product.name}
          </h2>
          {product.isBestseller ? (
            <span className="mt-2 inline-block rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-success">
              Bestseller
            </span>
          ) : null}
          <p className="mt-3 text-2xl font-bold text-royal">
            {formatIDR(product.price)}
          </p>
          <h3 className="mt-6 text-sm font-bold text-royal">Deskripsi</h3>
          <p className="mt-2 text-sm leading-relaxed text-royal/85">
            {product.description}
          </p>
        </div>

        <Link
          to={`/umkm/${store.id}`}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-royal/10 bg-surface p-4 shadow-sm transition hover:border-royal/20"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-royal text-lg font-bold text-white">
            {sellerInitial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-royal">{sellerTitle}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {sellerLoc}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-royal/35" aria-hidden />
        </Link>
      </div>

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 mx-auto max-w-lg px-4">
        {!storeOpen ? (
          <p className="mb-2 text-center text-xs text-muted">
            Toko mungkin tutup sementara; pesan WA tetap dapat dicoba.
          </p>
        ) : null}
        <button
          type="button"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-wa text-base font-bold text-white shadow-lg transition hover:bg-wa/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wa active:scale-[0.99]"
          onClick={() => void openExternalUrl(waOrder)}
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2} aria-hidden />
          Pesan via WhatsApp
        </button>
      </div>
    </div>
  )
}
