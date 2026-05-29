import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Grid2X2,
  Info,
  MapPinned,
  ReceiptText,
  ShoppingBag,
  Store,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomDrawer } from '@/components/ui/BottomDrawer'
import { MainNavDrawerList } from '@/components/layout/MainNavDrawerList'
import { fetchBillingCurrent } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LazyImage } from '@/components/ui/LazyImage'
import { useApiNewsList } from '@/features/news/useApiNews'
import { resolveAvatarUrl } from '@/lib/avatar'
import { getGreetingLabel } from '@/lib/greeting'
import { formatIDR } from '@/lib/format'
import type { BillingStatus, QuickMenuKey } from '@/store/sessionStore'
import { useSessionStore } from '@/store/sessionStore'

const circleBase =
  'flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full transition active:scale-95'

const iconStyleDefault = 'surface-icon-btn text-royal'

const iconStyleAccent =
  'border border-amber-200 bg-amber-100 text-amber-900 shadow-[0_2px_8px_rgba(0,35,102,0.08)]'
const iconStyleInfo =
  'border border-royal/12 bg-sky-50 text-royal shadow-[0_2px_8px_rgba(0,35,102,0.08)]'

function monthLabelId(): string {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/^\w/, (c) => c.toUpperCase())
}

function billingStatusLabel(status: BillingStatus): string {
  if (status === 'paid') return 'Lunas'
  if (status === 'pending') return 'Menunggu verifikasi'
  return 'Belum dibayar'
}

function billingStatusPillClass(status: BillingStatus): string {
  if (status === 'paid') return 'bg-success-soft text-success'
  if (status === 'pending') return 'bg-amber-100 text-amber-900'
  return 'bg-danger-soft text-danger'
}

export function DashboardHeroHeader() {
  const full_name = useSessionStore((s) => s.full_name)
  const block = useSessionStore((s) => s.block)
  const housing_name = useSessionStore((s) => s.housing_name)
  const foto_profil_url = useSessionStore((s) => s.foto_profil_url)
  const is_parent = useSessionStore((s) => s.is_parent)
  const server_time_iso = useSessionStore((s) => s.server_time_iso)
  const serverDate = server_time_iso ? new Date(server_time_iso) : null
  const greeting = getGreetingLabel(serverDate)
  const sub = is_parent ? block : `${block} · Anggota`

  return (
    <header className="relative px-4 pb-[4.5rem] pt-8 text-beige">
      {housing_name ? (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">
          {housing_name}
        </p>
      ) : null}
      <p className="text-sm font-medium text-white/90">{greeting}</p>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={resolveAvatarUrl(foto_profil_url, full_name)}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full border-2 border-white/25 bg-white/10 object-cover"
            width={48}
            height={48}
          />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-white">
              {full_name}
            </h1>
            <p className="mt-0.5 text-sm text-white/75">{sub}</p>
          </div>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </header>
  )
}

/** Kartu tagihan putih yang menimpa header (hanya wali). */
export function BillingOverlapCard() {
  const billing_status = useSessionStore((s) => s.billing_status)
  const current_ipl_amount = useSessionStore((s) => s.current_ipl_amount)
  const setFromServer = useSessionStore((s) => s.setFromServer)
  const month = monthLabelId()

  useEffect(() => {
    if (!isApiConfigured()) return
    void fetchBillingCurrent()
      .then((bill) => {
        setFromServer({
          billing_status: bill.status,
          current_ipl_amount: bill.total_amount,
        })
      })
      .catch(() => {
        /* keep session */
      })
  }, [setFromServer])

  return (
    <section className="relative z-10 -mt-12 px-4" aria-label="Ringkasan tagihan">
      <div className="surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Tagihan {month}
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-royal">
          {formatIDR(current_ipl_amount)}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted">Status</span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${billingStatusPillClass(billing_status)}`}
          >
            {billingStatusLabel(billing_status)}
          </span>
        </div>
        <ButtonLink to="/ipl" variant="primary" className="mt-5 w-full">
          {billing_status === 'paid'
            ? 'Lihat riwayat'
            : billing_status === 'pending'
              ? 'Lihat status'
              : 'Bayar sekarang'}
        </ButtonLink>
      </div>
    </section>
  )
}

/** Kartu overlap untuk anggota (tanpa nominal tagihan). */
export function MemberOverlapStack() {
  const { items } = useApiNewsList()
  const highlight = items.find((n) => n.is_priority) ?? items[0]

  return (
    <section className="relative z-10 -mt-14 space-y-3 px-4">
      <Card className="border-royal/10 shadow-[0_8px_24px_rgba(0,35,102,0.08)]">
        <h2 className="text-sm font-bold text-royal">Informasi kawasan</h2>
        {highlight ? (
          <>
            <p className="mt-2 text-sm text-muted line-clamp-3">{highlight.excerpt}</p>
            <Link
              to={`/news/${highlight.slug}`}
              className="mt-3 inline-block text-sm font-semibold text-royal underline-offset-2 hover:underline"
            >
              Baca pengumuman
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Pengumuman terbaru akan tampil di sini setelah dipublikasikan.
          </p>
        )}
      </Card>
      <Card className="border-danger/20 bg-danger-soft/50 shadow-[0_8px_24px_rgba(154,28,28,0.08)]">
        <h2 className="text-sm font-bold text-danger">Darurat / lapor</h2>
        <p className="mt-2 text-sm text-danger/90">
          Untuk keadaan darurat, hubungi pengurus RT atau saluran resmi
          pengelola.
        </p>
      </Card>
    </section>
  )
}

const quickLabel =
  'mt-2 flex min-h-[2.25rem] w-full items-start justify-center px-0.5 text-center text-[10px] font-semibold leading-snug text-royal line-clamp-2'

const quickCell =
  'flex min-w-0 flex-col items-center rounded-xl py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal/40'

type QuickResolved = { to: string; label: string; icon: LucideIcon; iconWrap: string }

function resolveQuickMenuItems(
  order: QuickMenuKey[],
  is_parent: boolean,
  member_ipl_slot: 'lapor' | 'informasi',
  billing_status: BillingStatus,
  preferRetail: boolean,
): QuickResolved[] {
  const safeOrder = Array.isArray(order) ? order : []
  const slice = safeOrder.slice(0, 4)
  const out: QuickResolved[] = []

  for (const key of slice) {
    if (key === 'ipl') {
      if (!is_parent) {
        if (member_ipl_slot === 'lapor') {
          out.push({
            to: '/lapor',
            label: 'Lapor',
            icon: AlertTriangle,
            iconWrap: iconStyleAccent,
          })
        } else {
          out.push({
            to: '/informasi',
            label: 'Informasi',
            icon: Info,
            iconWrap: iconStyleInfo,
          })
        }
        continue
      }
      const paidLike = billing_status === 'paid'
      out.push({
        to: '/ipl',
        label: 'Tagihan IPL',
        icon: paidLike ? BadgeCheck : ReceiptText,
        iconWrap: iconStyleDefault,
      })
      continue
    }

    if (key === 'umkm') {
      out.push({
        to: '/umkm',
        label: 'Toko Terdekat',
        icon: Store,
        iconWrap: iconStyleDefault,
      })
      continue
    }
    if (key === 'fasilitas_umum') {
      out.push({
        to: '/fasilitas',
        label: 'Fasilitas',
        icon: MapPinned,
        iconWrap: iconStyleDefault,
      })
      continue
    }
    if (key === 'retail') {
      out.push({
        to: '/umkm',
        label: 'Retail',
        icon: ShoppingBag,
        iconWrap: iconStyleDefault,
      })
      continue
    }
    if (key === 'lapor') {
      out.push({
        to: '/lapor',
        label: 'Lapor',
        icon: AlertTriangle,
        iconWrap: iconStyleAccent,
      })
      continue
    }
    if (key === 'informasi') {
      out.push({
        to: '/informasi',
        label: 'Informasi',
        icon: Info,
        iconWrap: iconStyleInfo,
      })
      continue
    }
  }

  /* Slot ke-4 legacy: preferRetail mengganti label lokasi untuk wali */
  if (preferRetail && is_parent) {
    const locIdx = out.findIndex((x) => x.to === '/ibadah/tempat')
    if (locIdx >= 0) {
      out[locIdx] = {
        to: '/umkm',
        label: 'Retail',
        icon: ShoppingBag,
        iconWrap: iconStyleDefault,
      }
    }
  }

  return out
}

export function HomeQuickActions() {
  const is_parent = useSessionStore((s) => s.is_parent)
  const quick_menu_order = useSessionStore((s) => s.quick_menu_order)
  const member_ipl_slot = useSessionStore((s) => s.member_ipl_slot)
  const billing_status = useSessionStore((s) => s.billing_status)
  const preferRetail = useSessionStore((s) => s.prefer_retail_quick_slot)
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)

  const quickItems = resolveQuickMenuItems(
    quick_menu_order,
    is_parent,
    member_ipl_slot,
    billing_status,
    preferRetail,
  ).slice(0, 3)

  return (
    <section className="px-4 pt-6" aria-label="Menu cepat">
      <div className="surface-card px-4 py-4">
        <h2 className="mb-3 text-sm font-bold text-royal">Menu cepat</h2>
        <div className="grid grid-cols-4 gap-2">
          {quickItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={`${item.to}-${item.label}`} to={item.to} className={quickCell}>
                <span className={`${circleBase} ${item.iconWrap}`}>
                  <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                </span>
                <span className={quickLabel}>{item.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMenuDrawerOpen(true)}
            className={quickCell}
            aria-haspopup="dialog"
            aria-expanded={menuDrawerOpen}
          >
            <span className={`${circleBase} ${iconStyleDefault}`}>
              <Grid2X2 className="h-6 w-6" strokeWidth={2} aria-hidden />
            </span>
            <span className={quickLabel}>Lainnya</span>
          </button>
        </div>
      </div>

      <BottomDrawer
        open={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        title="Menu"
      >
        <MainNavDrawerList onNavigate={() => setMenuDrawerOpen(false)} />
      </BottomDrawer>
    </section>
  )
}

export function HomeNewsSection() {
  const { items, loading } = useApiNewsList()
  const hero = items.find((n) => n.is_priority) ?? items[0]
  const secondary = items.find((n) => n.slug !== hero?.slug)
  const heroBadge = hero?.heroRibbon ?? hero?.displayTag ?? 'Berita'

  if (loading) {
    return (
      <section className="mt-4 border-t border-royal/20 px-4 pb-8 pt-8">
        <p className="text-sm text-muted">Memuat berita…</p>
      </section>
    )
  }

  if (!hero) {
    return (
      <section className="mt-4 border-t border-royal/20 px-4 pb-8 pt-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-royal">Berita &amp; info warga</h2>
          <Link
            to="/news"
            className="shrink-0 text-sm font-semibold text-royal underline-offset-2 hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <p className="text-sm text-muted">
          Belum ada berita dipublikasikan.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-4 border-t border-royal/20 px-4 pb-8 pt-8" aria-label="Berita dan info warga">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-royal">Berita &amp; info warga</h2>
        <Link
          to="/news"
          className="shrink-0 text-sm font-semibold text-royal underline-offset-2 hover:underline"
        >
          Lihat semua
        </Link>
      </div>

      {hero ? (
        <Link
          to={`/news/${hero.slug}`}
          className="surface-card relative mb-4 block overflow-hidden p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/40"
        >
          <LazyImage
            src={hero.imageSrc}
            alt=""
            className="aspect-video w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          <span className="absolute left-3 top-3 rounded-md bg-beige px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-royal shadow-sm">
            {heroBadge}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4 text-left text-white">
            <h3 className="text-lg font-bold leading-snug">{hero.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/90">{hero.excerpt}</p>
          </div>
        </Link>
      ) : null}

      {secondary ? (
        <Link
          to={`/news/${secondary.slug}`}
          className="surface-card flex gap-3 p-3 transition hover:border-royal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/40"
        >
          <LazyImage
            src={secondary.imageSrc}
            alt=""
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1 text-left">
            <h3 className="font-bold leading-snug text-royal">{secondary.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{secondary.excerpt}</p>
            <p className="mt-2 text-xs text-muted">{secondary.listTimeLabel}</p>
          </div>
        </Link>
      ) : null}
    </section>
  )
}

/** @deprecated gunakan BillingOverlapCard di layout baru */
export function BillingSummaryCard() {
  return <BillingOverlapCard />
}

/** @deprecated diganti MemberOverlapStack */
export function MemberHomeWidgets() {
  return <MemberOverlapStack />
}