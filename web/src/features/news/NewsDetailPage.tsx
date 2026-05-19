import { ArrowLeft, Share2, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchNewsDetail } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { ButtonLink } from '@/components/ui/Button'
import { LazyImage } from '@/components/ui/LazyImage'
import { getNewsBySlug, getRelatedNews, type NewsItem } from '@/data/news'
import { useApiNewsList } from '@/features/news/useApiNews'
import { mapApiNewsDetail } from '@/lib/apiMappers'
import { formatNewsDetailMeta } from '@/lib/format'
import { markNewsRead } from '@/lib/newsRead'

async function shareArticle(title: string): Promise<void> {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({ title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    window.alert('Link berita disalin ke papan klip.')
  } catch {
    /* dibatalkan pengguna atau tidak didukung */
  }
}

export function NewsDetailPage() {
  const { slug } = useParams()
  const apiOn = isApiConfigured()
  const { items: allNews } = useApiNewsList()
  const [article, setArticle] = useState<NewsItem | undefined>(() =>
    apiOn ? undefined : slug ? getNewsBySlug(slug) : undefined,
  )
  const [loading, setLoading] = useState(apiOn)

  useEffect(() => {
    if (!slug) return
    if (!apiOn) {
      setArticle(getNewsBySlug(slug))
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchNewsDetail(slug)
      .then((n) => {
        if (!cancelled) setArticle(mapApiNewsDetail(n))
      })
      .catch(() => {
        if (!cancelled) setArticle(undefined)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, apiOn])

  const related = useMemo(() => {
    if (!article) return []
    if (!apiOn) return getRelatedNews(article.slug, 2)
    return allNews.filter((n) => n.slug !== article.slug).slice(0, 2)
  }, [article, allNews, apiOn])

  useEffect(() => {
    if (article?.slug) markNewsRead(article.slug)
  }, [article?.slug])

  if (loading) {
    return (
      <PageCenter>
        <p className="text-sm text-muted">Memuat artikel…</p>
      </PageCenter>
    )
  }

  if (!article) {
    return (
      <PageCenter>
        <p className="text-muted">Artikel tidak ditemukan.</p>
        <ButtonLink to="/news" variant="secondary" className="mt-4 inline-flex">
          Kembali ke berita
        </ButtonLink>
      </PageCenter>
    )
  }

  return (
    <div className="min-h-full bg-beige pb-28 text-left">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-royal px-3 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] text-white shadow-md">
        <Link
          to="/news"
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <span>Berita</span>
        </Link>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
          aria-label="Bagikan"
          onClick={() => void shareArticle(article.title)}
        >
          <Share2 className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      </header>

      <LazyImage
        src={article.imageSrc}
        alt=""
        className="aspect-video w-full object-cover"
      />

      <article className="px-4 pb-8 pt-5">
        <span className="inline-block rounded-full bg-success-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-success">
          {article.displayTag}
        </span>

        <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-royal">
          {article.title}
        </h1>

        <div className="mt-5 flex gap-3 border-b border-royal/10 pb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-royal text-white">
            <UserRound className="h-6 w-6" strokeWidth={2} aria-hidden />
          </span>
          <AuthorMeta article={article} />
        </div>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-royal/90">
          {article.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {article.bodyImageSrc ? (
          <figure className="mt-8">
            <LazyImage
              src={article.bodyImageSrc}
              alt=""
              className="w-full rounded-xl object-cover"
            />
            {article.bodyImageCaption ? (
              <figcaption className="mt-2 rounded-lg bg-royal/[0.06] px-3 py-2 text-sm text-muted">
                {article.bodyImageCaption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-10 border-t border-royal/10 pt-8" aria-label="Berita terkait">
            <h2 className="text-base font-bold text-royal">Berita terkait</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    to={`/news/${r.slug}`}
                    className="flex gap-3 rounded-2xl border border-royal/10 bg-surface p-3 shadow-sm transition hover:border-royal/20"
                  >
                    <LazyImage
                      src={r.imageSrc}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug text-royal">
                        {r.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted">{r.listTimeLabel}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </div>
  )
}

function PageCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-page-grey px-4 py-12 text-center">{children}</div>
  )
}

function AuthorMeta({ article }: { article: NewsItem }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-bold text-royal">{article.authorRole}</p>
      <p className="mt-0.5 text-xs text-muted">
        {formatNewsDetailMeta(article.publishedAt)}
      </p>
    </div>
  )
}
