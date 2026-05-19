import { useEffect, useState } from 'react'
import { fetchNewsCategories } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { NEWS_CATEGORY_CHIPS, type NewsFilter } from '@/data/news'

export function useNewsCategories(): { chips: NewsFilter[]; loading: boolean } {
  const fallback: NewsFilter[] = [...NEWS_CATEGORY_CHIPS]
  const [chips, setChips] = useState<NewsFilter[]>(fallback)
  const [loading, setLoading] = useState(isApiConfigured())

  useEffect(() => {
    if (!isApiConfigured()) return
    let cancelled = false
    void fetchNewsCategories()
      .then((rows) => {
        if (cancelled) return
        const labels = rows.map((c) => c.label as NewsFilter)
        setChips(['Semua', ...labels])
      })
      .catch(() => {
        if (!cancelled) setChips(['Semua'])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { chips, loading }
}
