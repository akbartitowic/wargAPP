import { useCallback, useEffect, useState } from 'react'
import { fetchBillingDashboard, listHousingComplexes, type BillingDashboard } from '@/api/admin'
import { getCmsSession } from '@/lib/cmsSession'

export function useBillingFilters() {
  const session = getCmsSession()
  const now = new Date()
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [housingId, setHousingId] = useState(session.housing_complex_id ?? '')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [dashboard, setDashboard] = useState<BillingDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const effectiveHousing = session.is_super_admin ? housingId : session.housing_complex_id

  const loadDashboard = useCallback(() => {
    if (!effectiveHousing) {
      setDashboard(null)
      return Promise.resolve()
    }
    setLoading(true)
    return fetchBillingDashboard({ housing_complex_id: effectiveHousing, year, month })
      .then((dash) => {
        setDashboard(dash)
        setMsg(null)
      })
      .catch((e) => {
        setMsg(e instanceof Error ? e.message : 'Gagal memuat data')
      })
      .finally(() => setLoading(false))
  }, [effectiveHousing, year, month])

  useEffect(() => {
    if (session.is_super_admin) {
      void listHousingComplexes()
        .then((list) => {
          setHousingOptions(list.map((h) => ({ id: h.id, name: h.name })))
          if (!housingId && list[0]) setHousingId(list[0].id)
        })
        .catch(() => setHousingOptions([]))
    }
  }, [session.is_super_admin, housingId])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return {
    session,
    housingOptions,
    housingId,
    setHousingId,
    year,
    setYear,
    month,
    setMonth,
    dashboard,
    loading,
    loadDashboard,
    msg,
    setMsg,
    effectiveHousing,
  }
}
