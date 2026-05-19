import { ArrowLeft, Clock, ExternalLink, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { LazyImage } from '@/components/ui/LazyImage'
import { useFacility } from '@/hooks/useFacilities'
import { googleMapsDirectionsUrl, googleMapsEmbedUrl, googleMapsViewUrl } from '@/lib/maps'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { openExternalUrl } from '@/lib/openExternal'
import { isStoreOpenNow } from '@/lib/umkmHours'

export function FacilityDetailPage() {
  const { facilityId } = useParams()
  const { facility, loading, error } = useFacility(facilityId)

  if (loading) {
    return (
      <div className="min-h-full bg-page-grey px-4 py-12 text-center text-sm text-muted">
        Memuat…
      </div>
    )
  }

  if (error || !facility) {
    return (
      <div className="min-h-full bg-page-grey px-4 py-12 text-center">
        <p className="text-sm text-muted">{error ?? 'Fasilitas tidak ditemukan.'}</p>
        <Link to="/fasilitas" className="mt-4 inline-block text-sm font-semibold text-royal">
          Kembali
        </Link>
      </div>
    )
  }

  const open =
    facility.open_time && facility.close_time
      ? isStoreOpenNow(facility.open_time, facility.close_time)
      : true

  return (
    <div className="min-h-full bg-page-grey pb-28">
      <div className="relative">
        <LazyImage
          src={resolveMediaUrl(facility.image_url)}
          alt=""
          className="aspect-[16/11] w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <Link
          to="/fasilitas"
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white text-royal shadow-md"
          aria-label="Kembali"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>

      <div className="relative z-10 -mt-8 rounded-t-3xl bg-page-grey px-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {facility.facility_type}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-royal">{facility.name}</h1>
        <span
          className={
            open
              ? 'mt-2 inline-flex rounded-full bg-success px-2.5 py-0.5 text-[11px] font-bold uppercase text-white'
              : 'mt-2 inline-flex rounded-full bg-muted/30 px-2.5 py-0.5 text-[11px] font-bold uppercase text-muted'
          }
        >
          {open ? 'Sedang buka' : 'Tutup'}
        </span>

        {facility.description ? (
          <p className="mt-4 text-sm leading-relaxed text-muted">{facility.description}</p>
        ) : null}

        {facility.address ? (
          <p className="mt-4 flex items-start gap-2 text-sm text-royal">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            {facility.address}
          </p>
        ) : null}

        {facility.open_time && facility.close_time ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Clock className="size-4 shrink-0" aria-hidden />
            Jam operasional: {facility.open_time} – {facility.close_time}
            <span className="text-xs">({facility.open_status_label})</span>
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-royal/10 bg-surface shadow-sm">
          <iframe
            title={`Peta ${facility.name}`}
            src={googleMapsEmbedUrl(facility.latitude, facility.longitude)}
            className="aspect-[4/3] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-royal text-sm font-semibold text-white shadow-sm"
            onClick={() =>
              void openExternalUrl(
                googleMapsDirectionsUrl(facility.latitude, facility.longitude),
              )
            }
          >
            <ExternalLink className="size-4" aria-hidden />
            Petunjuk arah (Google Maps)
          </button>
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-royal/15 bg-surface text-sm font-semibold text-royal"
            onClick={() =>
              void openExternalUrl(googleMapsViewUrl(facility.latitude, facility.longitude))
            }
          >
            <MapPin className="size-4" aria-hidden />
            Buka di Google Maps
          </button>
        </div>
      </div>
    </div>
  )
}
