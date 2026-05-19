import { useEffect, useState } from 'react'
import { fetchUmkmShops } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { UMKM_STORES, type UmkmStore } from '@/data/umkm'
import { mapApiShopToStore } from '@/lib/umkmMappers'

export function useUmkmShops(category?: string): {
  stores: UmkmStore[]
  loading: boolean
  error: string | null
} {
  const [stores, setStores] = useState<UmkmStore[]>(isApiConfigured() ? [] : UMKM_STORES)
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured()) return
    let cancelled = false
    setLoading(true)
    void fetchUmkmShops(category && category !== 'Semua' ? { category } : undefined)
      .then((rows) => {
        if (!cancelled) {
          setStores(rows.map(mapApiShopToStore))
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setStores([])
          setError(e instanceof Error ? e.message : 'Gagal memuat UMKM')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [category])

  return { stores, loading, error }
}
