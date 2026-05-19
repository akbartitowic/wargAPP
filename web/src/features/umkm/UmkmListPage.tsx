import { MessageCircle, MapPin, Search, Settings2, Star, Store } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { WargaAppTopBar } from '@/components/layout/WargaAppTopBar'
import { LazyImage } from '@/components/ui/LazyImage'
import { UMKM_CATEGORY_CHIPS, type UmkmCategoryFilter } from '@/data/umkm'
import { useMyPartnerShop } from '@/hooks/useMyPartnerShop'
import { useUmkmShops } from '@/hooks/useUmkmShops'
import { openExternalUrl } from '@/lib/openExternal'
import { isStoreOpenNow } from '@/lib/umkmHours'

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: UmkmCategoryFilter
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'shrink-0 rounded-full bg-royal px-4 py-2 text-sm font-semibold text-white shadow-sm transition'
          : 'shrink-0 rounded-full border border-royal/15 bg-surface px-4 py-2 text-sm font-semibold text-royal transition hover:border-royal/25'
      }
    >
      {label}
    </button>
  )
}

export function UmkmListPage() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<UmkmCategoryFilter>('Semua')
  const { stores, loading, error } = useUmkmShops(category)
  const {
    shop: myShop,
    isPartner,
    isApprovedPartner,
    loading: partnerLoading,
  } = useMyPartnerShop()

  const filtered = useMemo(() => {
    let list = [...stores]
    if (category !== 'Semua') {
      list = list.filter((s) => s.filterCategory === category)
    }
    const s = q.trim().toLowerCase()
    if (s) {
      list = list.filter(
        (x) =>
          x.name.toLowerCase().includes(s) ||
          x.tagline.toLowerCase().includes(s) ||
          x.detailLine.toLowerCase().includes(s) ||
          x.filterCategory.toLowerCase().includes(s),
      )
    }
    list.sort((a, b) => {
      const dr = b.rating - a.rating
      if (dr !== 0) return dr
      return a.distanceKm - b.distanceKm
    })
    return list
  }, [q, category, stores])

  return (
    <div className="min-h-full bg-page-grey pb-28 text-left">
      <header className="bg-royal pt-[max(0.5rem,env(safe-area-inset-top))] shadow-sm">
        <WargaAppTopBar />
      </header>

      <div className="px-4 pb-6 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-royal">UMKM Warga</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Dukung usaha tetangga, penuhi kebutuhan sehari-hari.
        </p>

        {partnerLoading ? null : isPartner && !isApprovedPartner ? (
          <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3.5 text-sm text-amber-950">
            <p className="font-semibold">Pengajuan mitra sedang ditinjau</p>
            <p className="mt-1 text-xs opacity-90">
              Toko &quot;{myShop?.name}&quot; menunggu persetujuan pengurus. Anda bisa kelola setelah
              disetujui.
            </p>
          </div>
        ) : isApprovedPartner ? (
          <Link
            to="/umkm/kelola-toko"
            className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-royal px-4 py-3.5 text-white shadow-[0_8px_24px_rgba(0,35,102,0.2)] transition hover:bg-royal/90 active:scale-[0.99]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Settings2 className="size-5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="text-left">
                <span className="block text-sm font-semibold">Kelola toko Anda</span>
                {myShop?.name ? (
                  <span className="block truncate text-xs font-normal text-white/80">
                    {myShop.name}
                    {myShop.status === 'pending' ? ' · menunggu persetujuan' : ''}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-white/90">Buka</span>
          </Link>
        ) : (
          <Link
            to="/umkm/daftar-mitra"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-royal/25 bg-surface px-4 py-3.5 text-sm font-semibold text-royal shadow-sm transition hover:border-royal/40 hover:bg-royal/5"
          >
            <Store className="size-5" strokeWidth={2} aria-hidden />
            Daftar menjadi mitra UMKM
          </Link>
        )}

        <label className="relative mt-5 block">
          <span className="sr-only">Cari toko atau produk</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted/70"
            strokeWidth={2}
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari toko atau produk…"
            className="min-h-12 w-full rounded-2xl border border-royal/12 bg-surface py-3 pl-11 pr-4 text-sm text-royal shadow-sm placeholder:text-muted/60 focus-visible:border-royal focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/25"
          />
        </label>

        <div
          className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filter kategori"
        >
          {UMKM_CATEGORY_CHIPS.map((chip) => (
            <CategoryChip
              key={chip}
              label={chip}
              active={category === chip}
              onClick={() => setCategory(chip)}
            />
          ))}
        </div>

        {loading ? (
          <p className="mt-6 text-center text-sm text-muted">Memuat toko…</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <ul className="mt-6 flex flex-col gap-5">
          {filtered.map((store) => {
            const open = isStoreOpenNow(store.openTime, store.closeTime)
            return (
            <li key={store.id}>
              <article className="overflow-hidden rounded-2xl border border-royal/10 bg-surface shadow-[0_8px_24px_rgba(0,35,102,0.08)]">
                <Link to={`/umkm/${store.id}`} className="relative block">
                  <LazyImage
                    src={store.imageSrc}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs font-bold text-white backdrop-blur-[2px]">
                    <Star
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                    {store.rating.toFixed(1)}
                  </span>
                </Link>

                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      to={`/umkm/${store.id}`}
                      className="min-w-0 flex-1 text-lg font-bold leading-snug text-royal hover:underline"
                    >
                      {store.name}
                    </Link>
                    <span
                      className={
                        open
                          ? 'shrink-0 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white'
                          : 'shrink-0 rounded-full bg-muted/30 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted'
                      }
                    >
                      {open ? 'Buka' : 'Tutup'}
                    </span>
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                    <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    <span>{store.detailLine}</span>
                  </p>

                  <button
                    type="button"
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-royal text-sm font-semibold text-white shadow-sm transition hover:bg-royal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal active:scale-[0.99]"
                    onClick={() => void openExternalUrl(store.whatsappHref)}
                  >
                    <MessageCircle className="h-5 w-5" strokeWidth={2} aria-hidden />
                    Pesan via WhatsApp
                  </button>
                </div>
              </article>
            </li>
            )
          })}
        </ul>

        {filtered.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">
            Tidak ada toko yang cocok. Ubah filter atau kata kunci pencarian.
          </p>
        ) : null}
      </div>
    </div>
  )
}
