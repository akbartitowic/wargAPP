import { useEffect, useState } from 'react'
import { fetchWorshipPlaces, fetchWorshipSchedule } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import {
  WORSHIP_PLACES,
  WORSHIP_SCHEDULES,
  type WorshipPlaceRow,
  type WorshipScheduleRow,
} from '@/data/worship'
import { groupSchedulesByPlace, mapApiPlaces } from '@/lib/worshipMappers'

export function useWorshipSchedule(): {
  rows: WorshipScheduleRow[]
  loading: boolean
} {
  const [rows, setRows] = useState<WorshipScheduleRow[]>(
    isApiConfigured() ? [] : WORSHIP_SCHEDULES,
  )
  const [loading, setLoading] = useState(isApiConfigured())

  useEffect(() => {
    if (!isApiConfigured()) return
    let cancelled = false
    void fetchWorshipSchedule()
      .then((data) => {
        if (!cancelled) setRows(groupSchedulesByPlace(data))
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { rows, loading }
}

export function useWorshipPlaces(): {
  rows: WorshipPlaceRow[]
  loading: boolean
} {
  const [rows, setRows] = useState<WorshipPlaceRow[]>(
    isApiConfigured() ? [] : WORSHIP_PLACES,
  )
  const [loading, setLoading] = useState(isApiConfigured())

  useEffect(() => {
    if (!isApiConfigured()) return
    let cancelled = false
    void fetchWorshipPlaces()
      .then((data) => {
        if (!cancelled) setRows(mapApiPlaces(data))
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { rows, loading }
}
