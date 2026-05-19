import { ArrowLeft, Coffee, MessageCircle, Plus, Store } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { LazyImage } from '@/components/ui/LazyImage'
import { waUrlSetText } from '@/data/umkmProducts'
import { useUmkmProducts } from '@/hooks/useUmkmProducts'
import { useUmkmShops } from '@/hooks/useUmkmShops'
import { formatIDR } from '@/lib/format'
import { openExternalUrl } from '@/lib/openExternal'
import { isStoreOpenNow } from '@/lib/umkmHours'

export function UmkmStorePage() {
  const { storeId } = useParams()
  const { stores, loading: loadingStores } = useUmkmShops()
  const store = stores.find((s) => s.id === storeId)
  const { products, loading: loadingProducts } = useUmkmProducts(storeId)

  if (loadingStores) {
    return (
      <div className="min-h-full bg-page-grey px-4 py-12 text-center">
        <p className="text-muted">Memuat toko…</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-full bg-page-grey px-4 py-12 text-center">
        <p className="text-muted">Toko tidak ditemukan.</p>
        <ButtonLink to="/umkm" variant="secondary" className="mt-4 inline-flex">
          Kembali
        </ButtonLink>
      </div>
    )
  }

  const description =
    store.storeDescription ?? store.tagline

  const chatHref = waUrlSetText(
    store.whatsappHref,
    'Halo, saya dari Warga App ingin bertanya ke toko.',
  )

  const open = isStoreOpenNow(store.openTime, store.closeTime)

  return (
    <div className="min-h-full bg-page-grey pb-28">
      <div className="relative">
        <LazyImage
          src={store.imageSrc}
          alt=""
          className="aspect-[16/11] w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <Link
          to="/umkm"
          className="pointer-events-auto absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white text-royal shadow-md transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/40"
          aria-label="Kembali ke daftar UMKM"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
      </div>

      <div className="relative z-10 -mt-10 flex flex-col items-center px-4">
        <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[5px] border-page-grey bg-royal text-white shadow-lg">
          {store.filterCategory === 'Makanan' ? (
            <Coffee className="h-9 w-9" strokeWidth={1.75} aria-hidden />
          ) : (
            <Store className="h-9 w-9" strokeWidth={1.75} aria-hidden />
          )}
        </div>

        <div className="mt-4 w-full max-w-lg rounded-2xl border border-royal/10 bg-surface px-4 pb-5 pt-2 shadow-[0_8px_28px_rgba(0,35,102,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="font-serif text-2xl font-bold leading-tight text-royal">
              {store.name}
            </h1>
            <span
              className={
                open
                  ? 'shrink-0 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white'
                  : 'shrink-0 rounded-full bg-muted/25 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted'
              }
            >
              {open ? 'Buka' : 'Tutup'}
            </span>
          </div>
          <p className="mt-3 font-serif text-sm leading-relaxed text-royal/85">
            {description}
          </p>
          <button
            type="button"
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-royal bg-surface text-sm font-semibold text-royal transition hover:bg-royal/[0.04]"
            onClick={() => void openExternalUrl(chatHref)}
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2} aria-hidden />
            Chat toko
          </button>
        </div>
      </div>

      <section className="mt-8 px-4" aria-label="Katalog produk">
        <h2 className="font-serif text-lg font-bold text-royal">Katalog produk</h2>

        {loadingProducts ? (
          <p className="mt-4 text-sm text-muted">Memuat produk…</p>
        ) : products.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Belum ada produk di katalog ini.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {products.map((p) => (
              <li key={p.slug} className="relative">
                <Link
                  to={`/umkm/${store.id}/p/${p.slug}`}
                  className="block overflow-hidden rounded-2xl border border-royal/10 bg-surface shadow-sm transition hover:border-royal/20"
                >
                  <LazyImage
                    src={p.imageSrc}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                  <div className="p-3 pr-11">
                    <h3 className="font-serif text-sm font-bold leading-snug text-royal line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="mt-2 font-serif text-sm font-bold text-royal">
                      {formatIDR(p.price)}
                    </p>
                  </div>
                </Link>
                <Link
                  to={`/umkm/${store.id}/p/${p.slug}`}
                  className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-royal text-white shadow-md transition hover:bg-royal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
                  aria-label={`Detail ${p.name}`}
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="px-4 pt-6">
        <ButtonLink to="/umkm" variant="ghost" className="w-full justify-center">
          ← Semua toko
        </ButtonLink>
      </div>
    </div>
  )
}
