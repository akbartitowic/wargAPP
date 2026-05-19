import { useEffect, useState } from 'react'
import { fetchFacilities, fetchFacilityById, type ApiFacility } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'

export function useFacilities() {
  const [facilities, setFacilities] = useState<ApiFacility[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured()) {
      setFacilities([])
      setLoading(false)
      return
    }
    let cancelled = false
    void fetchFacilities()
      .then((rows) => {
        if (!cancelled) {
          setFacilities(rows)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setFacilities([])
          setError(e instanceof Error ? e.message : 'Gagal memuat fasilitas')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { facilities, loading, error }
}

export function useFacility(id: string | undefined) {
  const [facility, setFacility] = useState<ApiFacility | null>(null)
  const [loading, setLoading] = useState(Boolean(id && isApiConfigured()))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !isApiConfigured()) {
      setFacility(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchFacilityById(id)
      .then((row) => {
        if (!cancelled) {
          setFacility(row)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setFacility(null)
          setError(e instanceof Error ? e.message : 'Gagal memuat')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return { facility, loading, error }
}
