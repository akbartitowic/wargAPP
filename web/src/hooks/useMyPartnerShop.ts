import { useEffect, useState } from 'react'
import { fetchMyPartnerShop, type PartnerShopResponse } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'

export function useMyPartnerShop() {
  const [shop, setShop] = useState<PartnerShopResponse | null | undefined>(undefined)
  const [loading, setLoading] = useState(isApiConfigured())

  useEffect(() => {
    if (!isApiConfigured()) {
      setShop(null)
      setLoading(false)
      return
    }
    let cancelled = false
    void fetchMyPartnerShop()
      .then((row) => {
        if (!cancelled) setShop(row)
      })
      .catch(() => {
        if (!cancelled) setShop(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isPartner =
    shop?.status === 'pending' || shop?.status === 'approved'
  const isApprovedPartner = shop?.status === 'approved'

  return { shop, loading, isPartner, isApprovedPartner }
}
