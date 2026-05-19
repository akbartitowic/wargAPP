import { Clock, ExternalLink, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WargaAppTopBar } from '@/components/layout/WargaAppTopBar'
import { LazyImage } from '@/components/ui/LazyImage'
import { useFacilities } from '@/hooks/useFacilities'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { isStoreOpenNow } from '@/lib/umkmHours'

export function FacilitiesListPage() {
  const { facilities, loading, error } = useFacilities()

  return (
    <div className="min-h-full bg-page-grey pb-28 text-left">
      <header className="bg-royal pt-[max(0.5rem,env(safe-area-inset-top))] shadow-sm">
        <WargaAppTopBar />
      </header>

      <div className="px-4 pb-6 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-royal">Fasilitas umum</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Titik fasilitas di perumahan — lihat detail, peta, dan arah menuju lokasi.
        </p>

        {loading ? <p className="mt-6 text-sm text-muted">Memuat fasilitas…</p> : null}
        {error ? (
          <p className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="mt-6 flex flex-col gap-4">
          {facilities.map((f) => {
            const open =
              f.open_time && f.close_time
                ? isStoreOpenNow(f.open_time, f.close_time)
                : true
            return (
              <li key={f.id}>
                <Link
                  to={`/fasilitas/${f.id}`}
                  className="block overflow-hidden rounded-2xl border border-royal/10 bg-surface shadow-[0_8px_24px_rgba(0,35,102,0.08)]"
                >
                  <LazyImage
                    src={resolveMediaUrl(f.image_url)}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {f.facility_type}
                        </p>
                        <h2 className="text-lg font-bold text-royal">{f.name}</h2>
                      </div>
                      <span
                        className={
                          open
                            ? 'shrink-0 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-bold uppercase text-white'
                            : 'shrink-0 rounded-full bg-muted/30 px-2.5 py-0.5 text-[11px] font-bold uppercase text-muted'
                        }
                      >
                        {open ? 'Buka' : 'Tutup'}
                      </span>
                    </div>
                    {f.address ? (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {f.address}
                      </p>
                    ) : null}
                    {f.open_time && f.close_time ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                        <Clock className="size-3.5" aria-hidden />
                        {f.open_time} – {f.close_time}
                      </p>
                    ) : null}
                    <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-royal">
                      Lihat detail & peta
                      <ExternalLink className="size-4" aria-hidden />
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        {!loading && facilities.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">
            Belum ada fasilitas terdaftar. Hubungi pengurus perumahan.
          </p>
        ) : null}
      </div>
    </div>
  )
}
