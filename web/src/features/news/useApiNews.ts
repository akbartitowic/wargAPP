import { useEffect, useState } from 'react'
import { fetchNewsList } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { NEWS, type NewsItem } from '@/data/news'
import { mapApiNewsToItem } from '@/lib/apiMappers'

export function useApiNewsList(): { items: NewsItem[]; loading: boolean } {
  const apiOn = isApiConfigured()
  const [items, setItems] = useState<NewsItem[]>(apiOn ? [] : NEWS)
  const [loading, setLoading] = useState(apiOn)

  useEffect(() => {
    if (!apiOn) return
    let cancelled = false
    void fetchNewsList()
      .then((rows) => {
        if (!cancelled) setItems(rows.map(mapApiNewsToItem))
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading }
}
