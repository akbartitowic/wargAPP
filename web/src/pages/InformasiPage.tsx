import { ArrowLeft, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isApiConfigured } from '@/config/api/client'
import { Card } from '@/components/ui/Card'
import { LazyImage } from '@/components/ui/LazyImage'
import { useApiNewsList } from '@/features/news/useApiNews'

export function InformasiPage() {
  const apiOn = isApiConfigured()
  const { items, loading } = useApiNewsList()

  return (
    <div className="min-h-full bg-page-grey px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))] text-left">
      <header className="flex items-center gap-2 py-2">
        <Link
          to="/"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-royal transition hover:bg-royal/5"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <h1 className="text-xl font-bold text-royal">Informasi</h1>
      </header>

      {loading ? (
        <p className="mt-6 text-center text-sm text-muted">Memuat informasi…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <Card className="mt-4 border-royal/10">
          <p className="text-sm text-muted">
            {apiOn
              ? 'Belum ada pengumuman. Konten akan muncul setelah dipublikasikan di CMS.'
              : 'Atur VITE_API_BASE_URL dan login untuk melihat pengumuman dari server.'}
          </p>
          <Link
            to="/news"
            className="mt-3 inline-block text-sm font-semibold text-royal underline-offset-2 hover:underline"
          >
            Buka halaman Berita
          </Link>
        </Card>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              to={`/news/${item.slug}`}
              className="flex gap-3 rounded-2xl border border-royal/10 bg-surface p-3 shadow-sm transition hover:border-royal/20"
            >
              <LazyImage
                src={item.imageSrc}
                alt=""
                className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-xl object-cover"
              />
              <InformasiListBody item={item} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function InformasiListBody({
  item,
}: {
  item: { title: string; filterCategory: string; listTimeLabel: string; excerpt: string }
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium text-muted">
        <span className="font-semibold text-royal/80">{item.filterCategory}</span>
        <span className="text-muted"> · </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden />
          {item.listTimeLabel}
        </span>
      </p>
      <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-royal">
        {item.title}
      </h2>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
        {item.excerpt}
      </p>
    </div>
  )
}
