import { Clock, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { WargaAppTopBar } from '@/components/layout/WargaAppTopBar'
import { LazyImage } from '@/components/ui/LazyImage'
import { getFeaturedNews, getNewsFeedItems, type NewsFilter } from '@/data/news'
import { isApiConfigured } from '@/config/api/client'
import { useApiNewsList } from '@/features/news/useApiNews'
import { useNewsCategories } from '@/hooks/useNewsCategories'

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: NewsFilter
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'shrink-0 rounded-full bg-royal px-4 py-2 text-sm font-semibold text-white shadow-sm'
          : 'shrink-0 rounded-full border border-royal/20 bg-surface px-4 py-2 text-sm font-semibold text-royal'
      }
    >
      {label}
    </button>
  )
}

export function NewsListPage() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<NewsFilter>('Semua')
  const { chips: categoryChips } = useNewsCategories()
  const apiOn = isApiConfigured()
  const { items: apiItems, loading } = useApiNewsList()
  const featured = apiOn
    ? apiItems.find((n) => n.is_priority) ?? apiItems[0]
    : apiItems.find((n) => n.is_priority) ?? apiItems[0] ?? getFeaturedNews()
  const feedBase = apiOn
    ? apiItems.filter((n) => n.slug !== featured?.slug)
    : apiItems.length
      ? apiItems.filter((n) => n.slug !== featured?.slug)
      : getNewsFeedItems()

  const listForCategory =
    category === 'Semua'
      ? feedBase
      : feedBase.filter((n) => n.filterCategory === category)

  const s = q.trim().toLowerCase()
  const filteredFeed = !s
    ? listForCategory
    : listForCategory.filter(
        (n) =>
          n.title.toLowerCase().includes(s) ||
          n.excerpt.toLowerCase().includes(s) ||
          n.listSnippet.toLowerCase().includes(s),
      )

  const showFeatured =
    featured &&
    (category === 'Semua' || featured.filterCategory === category) &&
    (!q.trim() ||
      featured.title.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="min-h-full bg-page-grey pb-28 text-left">
      <header className="bg-royal pt-[max(0.5rem,env(safe-area-inset-top))] shadow-sm">
        <WargaAppTopBar />
      </header>

      <div className="px-4 pb-6 pt-5">
        <label className="relative mt-0 block">
          <span className="sr-only">Cari berita</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted/70"
            strokeWidth={2}
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari berita atau pengumuman…"
            className="min-h-12 w-full rounded-2xl border border-royal/12 bg-surface py-3 pl-11 pr-4 text-sm text-royal shadow-sm placeholder:text-muted/60 focus-visible:border-royal focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/25"
          />
        </label>

        <div
          className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filter berita"
        >
          {categoryChips.map((chip) => (
            <CategoryChip
              key={chip}
              label={chip}
              active={category === chip}
              onClick={() => setCategory(chip)}
            />
          ))}
        </div>

        {showFeatured && featured ? (
          <Link
            to={`/news/${featured.slug}`}
            className="relative mt-6 block overflow-hidden rounded-2xl shadow-[0_10px_32px_rgba(0,35,102,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/40"
          >
            <LazyImage
              src={featured.imageSrc}
              alt=""
              className="aspect-video w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/35 to-transparent" />
            {featured.heroRibbon ? (
              <span className="absolute left-3 top-3 rounded-md bg-beige/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-royal shadow">
                {featured.heroRibbon}
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <h2 className="text-lg font-bold leading-snug sm:text-xl">
                {featured.title}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white/90">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {featured.featuredTimeLabel ?? featured.listTimeLabel}
              </p>
            </div>
          </Link>
        ) : null}

        <h2 className="mt-8 text-base font-bold text-royal">Terbaru hari ini</h2>

        {loading ? (
          <p className="mt-6 text-center text-sm text-muted">Memuat berita…</p>
        ) : null}

        <ul className="mt-3 flex flex-col gap-3">
          {filteredFeed.map((item) => (
            <li key={item.slug}>
              <Link
                to={`/news/${item.slug}`}
                className="flex gap-3 rounded-2xl border border-royal/10 bg-surface p-3 shadow-sm transition hover:border-royal/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/35"
              >
                <LazyImage
                  src={item.imageSrc}
                  alt=""
                  className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-muted">
                    <span className="font-semibold text-royal/80">
                      {item.filterCategory}
                    </span>
                    <span className="text-muted"> · </span>
                    {item.listTimeLabel}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-royal">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                    {item.listSnippet}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {!loading && filteredFeed.length === 0 && !showFeatured ? (
          <p className="mt-8 text-center text-sm text-muted">
            {apiOn
              ? 'Belum ada berita. Konten akan muncul setelah dipublikasikan di CMS.'
              : 'Tidak ada berita untuk filter ini.'}
          </p>
        ) : null}
      </div>
    </div>
  )
}
