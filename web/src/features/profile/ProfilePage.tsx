import {
  Check,
  ChevronRight,
  Headset,
  IdCard,
  LogOut,
  Home,
  MapPin,
  UserCog,
  Users,
  UsersRound,
  ReceiptText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isApiConfigured } from '@/config/api/client'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import { WargaAppTopBar } from '@/components/layout/WargaAppTopBar'
import { resolveAvatarUrl } from '@/lib/avatar'
import { formatOccupancyStatus } from '@/lib/residence'
import { refreshProfileInSession } from '@/lib/sessionBootstrap'
import {
  applyMemberDemoProfile,
  applyParentDemoProfile,
  useSessionStore,
} from '@/store/sessionStore'

function DataField({
  label,
  icon: Icon,
  value,
}: {
  label: string
  icon: LucideIcon
  value: string
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      <div className="flex items-center gap-3 rounded-xl border border-royal/10 bg-royal/[0.04] px-3 py-3">
        <Icon className="h-5 w-5 shrink-0 text-royal/55" strokeWidth={2} aria-hidden />
        <span className="break-all text-sm font-semibold leading-snug text-royal">
          {value}
        </span>
      </div>
    </div>
  )
}

function MenuRow({
  icon: Icon,
  label,
  to,
  onClick,
  danger,
}: {
  icon: LucideIcon
  label: string
  to?: string
  onClick?: () => void
  danger?: boolean
}) {
  const base =
    'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-royal/25'
  const normal = `${base} border-royal/8 bg-surface text-royal hover:bg-royal/[0.03]`
  const dangerCls = `${base} border-danger/20 bg-danger-soft/80 text-danger hover:bg-danger-soft`

  const inner = (
    <>
      <span
        className={
          danger
            ? 'flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger'
            : 'flex h-10 w-10 items-center justify-center rounded-full bg-royal/6 text-royal'
        }
      >
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <ChevronRight
        className={danger ? 'h-5 w-5 text-danger/70' : 'h-5 w-5 text-royal/35'}
        aria-hidden
      />
    </>
  )

  if (to) {
    return (
      <Link to={to} className={danger ? dangerCls : normal}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={danger ? dangerCls : normal}>
      {inner}
    </button>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const authLogout = useAuthStore((s) => s.logout)
  const is_parent = useSessionStore((s) => s.is_parent)
  const full_name = useSessionStore((s) => s.full_name)
  const nik_masked = useSessionStore((s) => s.nik_masked)
  const kk_masked = useSessionStore((s) => s.kk_masked)
  const block = useSessionStore((s) => s.block)
  const housing_name = useSessionStore((s) => s.housing_name)
  const address = useSessionStore((s) => s.address)
  const occupancy_type = useSessionStore((s) => s.occupancy_type)
  const residence_start_date = useSessionStore((s) => s.residence_start_date)
  const residence_end_date = useSessionStore((s) => s.residence_end_date)
  const housingLabel = housing_name || 'Perumahan'
  const occupancyDisplay = formatOccupancyStatus(
    occupancy_type,
    residence_start_date,
    residence_end_date,
  )
  const foto_profil_url = useSessionStore((s) => s.foto_profil_url)
  const logoutLocal = useSessionStore((s) => s.logoutLocal)
  const isDev = import.meta.env.DEV

  useEffect(() => {
    if (isApiConfigured()) void refreshProfileInSession()
  }, [])

  const avatarSrc = resolveAvatarUrl(foto_profil_url, full_name)
  const addressDisplay =
    address ||
    [block, housing_name].filter(Boolean).join(', ') ||
    '—'

  return (
    <div className="min-h-full bg-page-grey pb-28 text-left">
      <header className="relative overflow-hidden rounded-b-3xl bg-royal pb-28 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[0_12px_40px_rgba(0,35,102,0.2)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              'radial-gradient(100% 70% at 50% 0%, rgba(255,255,255,0.2) 0%, transparent 55%)',
          }}
        />

        <WargaAppTopBar />

        <div className="relative mt-4 flex flex-col items-center px-4">
          <img
            src={avatarSrc}
            alt=""
            className="h-28 w-28 rounded-full border-[5px] border-white object-cover shadow-lg"
            width={112}
            height={112}
          />
          <p className="mt-4 text-center text-2xl font-bold leading-tight text-white">
            {full_name}
          </p>
          {housing_name ? (
            <p className="mt-2 text-center text-sm font-medium text-white/85">
              {housing_name}
            </p>
          ) : null}
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
            {is_parent
              ? 'Kepala Keluarga / Parent Account'
              : 'Anggota Keluarga'}
          </span>
        </div>
      </header>

      <div className="relative z-10 -mt-16 px-4">
        <Card className="border-royal/10 shadow-[0_8px_28px_rgba(0,35,102,0.1)]">
          <h2 className="text-base font-bold text-royal">Data warga</h2>
          <div className="mt-4 flex flex-col gap-4">
            <DataField
              label="Nomor Induk Kependudukan (NIK)"
              icon={IdCard}
              value={nik_masked}
            />
            <DataField
              label="Nomor Kartu Keluarga (No. KK)"
              icon={UsersRound}
              value={kk_masked}
            />
            <DataField label="Perumahan" icon={MapPin} value={housingLabel} />
            <DataField label="Status hunian" icon={Home} value={occupancyDisplay} />
            <DataField
              label="Alamat domisili"
              icon={MapPin}
              value={addressDisplay}
            />
          </div>
        </Card>
      </div>

      <nav className="mt-5 flex flex-col gap-2 px-4" aria-label="Menu profil">
        <MenuRow icon={UserCog} label="Ubah profil" to="/profile/edit" />
        <MenuRow icon={Users} label="Anggota keluarga" to="/profile/family" />
        {is_parent ? (
          <MenuRow icon={ReceiptText} label="Riwayat pembayaran IPL" to="/ipl" />
        ) : null}
        <MenuRow icon={Headset} label="Pusat bantuan" to="/profile/help" />
        <MenuRow
          icon={LogOut}
          label="Keluar (logout)"
          danger
          onClick={() => {
            if (window.confirm('Keluar dari aplikasi?')) {
              authLogout()
              logoutLocal()
              if (isApiConfigured()) navigate('/login', { replace: true })
            }
          }}
        />
      </nav>

      {isDev && !isApiConfigured() ? (
        <Card className="mx-4 mt-6 border-dashed border-royal/25 bg-beige/50">
          <h2 className="text-sm font-bold text-royal">Pengembangan lokal</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Hak akses wali/anggota (<code className="text-[11px]">is_parent</code>),
            status tagihan IPL, urutan menu cepat, slot Lapor/Informasi untuk
            anggota, dan preferensi retail akan diatur di CMS dan diterapkan
            lewat API setelah login — bukan dari aplikasi warga.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Tombol di bawah hanya memuat contoh payload (simulasi respons login)
            untuk uji UI di perangkat Anda.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-lg bg-royal py-2 text-xs font-semibold text-white"
              onClick={() => applyParentDemoProfile()}
            >
              Contoh: wali
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-royal/25 py-2 text-xs font-semibold text-royal"
              onClick={() => applyMemberDemoProfile()}
            >
              Contoh: anggota
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
