import { useEffect, useState } from 'react'
import { fetchUmkmProducts } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { getProductsByStoreId } from '@/data/umkmProducts'
import { mapApiProduct, type UmkmProductView } from '@/lib/umkmMappers'

export function useUmkmProducts(storeId: string | undefined): {
  products: UmkmProductView[]
  loading: boolean
} {
  const fallback = storeId ? getProductsByStoreId(storeId).map((p) => ({
    id: p.slug,
    slug: p.slug,
    name: p.name,
    price: p.price,
    imageSrc: p.imageSrc,
    description: p.description,
  })) : []

  const [products, setProducts] = useState<UmkmProductView[]>(
    isApiConfigured() ? [] : fallback,
  )
  const [loading, setLoading] = useState(isApiConfigured())

  useEffect(() => {
    if (!storeId) return
    if (!isApiConfigured()) {
      setProducts(fallback)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchUmkmProducts(storeId)
      .then((rows) => {
        if (!cancelled) setProducts(rows.map(mapApiProduct))
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [storeId])

  return { products, loading }
}
