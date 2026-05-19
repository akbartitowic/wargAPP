import { ExternalLink, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { worshipPlaceVisibleFor, worshipScheduleVisibleFor } from '@/data/worship'
import { useWorshipPlaces, useWorshipSchedule } from '@/hooks/useWorshipData'
import { googleMapsDirectionsUrl } from '@/lib/maps'
import { openExternalUrl } from '@/lib/openExternal'
import { useSessionStore } from '@/store/sessionStore'

export function WorshipSchedulePage() {
  const religion = useSessionStore((s) => s.religion)
  const { rows: allRows, loading } = useWorshipSchedule()
  const rows = allRows.filter((r) => worshipScheduleVisibleFor(r, religion))

  return (
    <div className="flex flex-col gap-4 px-4 py-2 pb-28 text-left">
      <h1 className="text-2xl font-bold text-royal">Jadwal ibadah</h1>
      <p className="text-sm text-muted">
        Daftar disaring menurut agama di profil Anda ({religion}). Ubah agama di
        profil bila perlu.
      </p>
      {loading ? (
        <p className="text-sm text-muted">Memuat jadwal…</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            Belum ada jadwal untuk agama ini. Hubungi pengurus RW.
          </p>
        </Card>
      ) : (
        rows.map((row) => (
          <Card key={row.id} className="border-royal/10">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-royal">{row.placeName}</h2>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {row.address}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-royal/15 bg-royal/[0.04] px-3 py-2 text-xs font-semibold text-royal transition hover:bg-royal/[0.08]"
                onClick={() =>
                  void openExternalUrl(
                    googleMapsDirectionsUrl(row.latitude, row.longitude),
                  )
                }
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Arah
              </button>
            </div>
            <ul className="mt-4 divide-y divide-royal/10 border-t border-royal/10 pt-3">
              {row.entries.map((e) => (
                <li
                  key={e.label}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0"
                >
                  <span className="text-sm font-medium text-royal">{e.label}</span>
                  <span className="text-sm text-muted">{e.time}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  )
}

export function WorshipPlacesPage() {
  const religion = useSessionStore((s) => s.religion)
  const { rows: allRows, loading } = useWorshipPlaces()
  const rows = allRows.filter((r) => worshipPlaceVisibleFor(r, religion))

  return (
    <div className="flex flex-col gap-4 px-4 py-2 pb-28 text-left">
      <h1 className="text-2xl font-bold text-royal">Tempat ibadah</h1>
      <p className="text-sm text-muted">
        Lokasi relevan untuk {religion}. Buka arah di Google Maps.
      </p>
      {loading ? (
        <p className="text-sm text-muted">Memuat lokasi…</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            Tidak ada titik terdaftar untuk agama ini.
          </p>
        </Card>
      ) : (
        rows.map((row) => (
          <Card key={row.id} className="border-royal/10">
            <h2 className="text-base font-bold text-royal">{row.name}</h2>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {row.detail}
            </p>
            <button
              type="button"
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-royal text-sm font-semibold text-white shadow-sm transition hover:bg-royal/90"
              onClick={() =>
                void openExternalUrl(
                  googleMapsDirectionsUrl(row.latitude, row.longitude),
                )
              }
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Buka di Google Maps
            </button>
          </Card>
        ))
      )}
    </div>
  )
}
