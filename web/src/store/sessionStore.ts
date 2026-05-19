import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { normalizeQuickMenuOrder } from '@/lib/quickMenu'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export type Religion =
  | 'Islam'
  | 'Kristen'
  | 'Katolik'
  | 'Hindu'
  | 'Buddha'
  | 'Khonghucu'
  | 'Lainnya'

export type BillingStatus = 'unpaid' | 'pending' | 'paid'

export type MemberIplSlot = 'lapor' | 'informasi'

/** Kunci menu cepat (urutan dari remote config / API). */
export type QuickMenuKey =
  | 'ipl'
  | 'umkm'
  | 'fasilitas_umum'
  | 'retail'
  | 'lapor'
  | 'informasi'

export type UserSession = {
  /** Wali = akses finansial IPL di UI — sumber kebenaran: CMS/API (bukan toggle app). */
  is_parent: boolean
  /** Gatekeeper API billing — dari GET /profile access_control */
  can_view_billing: boolean
  full_name: string
  nik_masked: string
  kk_masked: string
  no_hp: string
  block: string
  housing_name: string
  address: string
  occupancy_type: 'pemilik' | 'kontrak'
  residence_start_date: string
  residence_end_date: string | null
  foto_profil_url: string | null
  religion: Religion
  /** `unpaid` | `pending` | `paid` — dari CMS/API. */
  billing_status: BillingStatus
  current_ipl_amount: number
  prefer_retail_quick_slot: boolean
  /** Maks 4 item baris pertama — urutan & isi dari CMS/remote config. */
  quick_menu_order: QuickMenuKey[]
  /** Ganti slot IPL untuk anggota */
  member_ipl_slot: MemberIplSlot
  /** Waktu server (ISO); sapaan memakai ini bila ada */
  server_time_iso: string | null
  /** Sesi login — 30 hari */
  token_expires_at: number | null
}

type SessionState = UserSession & {
  setFromServer: (patch: Partial<UserSession>) => void
  logoutLocal: () => void
  /** Perpanjang token demo (setelah login nyata, isi dari API). */
  renewSessionExpiry: () => void
}

const defaultSession: UserSession = {
  is_parent: false,
  can_view_billing: false,
  full_name: '',
  nik_masked: '',
  kk_masked: '',
  no_hp: '',
  block: '',
  housing_name: '',
  address: '',
  occupancy_type: 'pemilik',
  residence_start_date: '',
  residence_end_date: null,
  foto_profil_url: null,
  religion: 'Islam',
  billing_status: 'paid',
  current_ipl_amount: 0,
  prefer_retail_quick_slot: false,
  quick_menu_order: ['ipl', 'umkm', 'fasilitas_umum'],
  member_ipl_slot: 'lapor',
  server_time_iso: null,
  token_expires_at: null,
}

const parentDemoSession: UserSession = {
  ...defaultSession,
  is_parent: true,
  can_view_billing: true,
  full_name: 'Bpk. Heru Pratama',
  nik_masked: '3201**********001',
  kk_masked: '3201**********890',
  no_hp: '081234567890',
  block: 'Blok A-12',
  housing_name: 'Perumahan Civic Harmony',
  address: 'Jl. Melati, Blok A-12, RT 05/RW 02',
  billing_status: 'unpaid',
  current_ipl_amount: 250_000,
  token_expires_at: Date.now() + THIRTY_DAYS_MS,
}

const memberDemoPatch: Partial<UserSession> = {
  is_parent: false,
  can_view_billing: false,
  full_name: 'Ibu Sari Pratama',
  nik_masked: '3201**********002',
  no_hp: '081234567891',
  quick_menu_order: ['lapor', 'umkm', 'fasilitas_umum'],
  billing_status: 'paid',
}

/** Normalisasi data persist lama (mis. `can_access_billing`) agar tidak crash di UI. */
function migratePersistedSession(
  raw: Partial<UserSession> & Record<string, unknown>,
): Partial<UserSession> {
  const legacy = raw as {
    can_access_billing?: boolean
    ipl_paid_for_current_period?: boolean
  }

  const is_parent =
    typeof raw.is_parent === 'boolean'
      ? raw.is_parent
      : typeof legacy.can_access_billing === 'boolean'
        ? legacy.can_access_billing
        : defaultSession.is_parent

  const can_view_billing =
    typeof raw.can_view_billing === 'boolean'
      ? raw.can_view_billing
      : is_parent

  let billing_status: BillingStatus = defaultSession.billing_status
  if (
    raw.billing_status === 'unpaid' ||
    raw.billing_status === 'pending' ||
    raw.billing_status === 'paid'
  ) {
    billing_status = raw.billing_status
  } else if (legacy.ipl_paid_for_current_period === true) {
    billing_status = 'paid'
  }

  const religions: Religion[] = [
    'Islam',
    'Kristen',
    'Katolik',
    'Hindu',
    'Buddha',
    'Khonghucu',
    'Lainnya',
  ]
  const religion = religions.includes(raw.religion as Religion)
    ? (raw.religion as Religion)
    : defaultSession.religion

  return {
    ...defaultSession,
    ...raw,
    is_parent,
    can_view_billing,
    billing_status,
    religion,
    quick_menu_order: Array.isArray(raw.quick_menu_order)
      ? normalizeQuickMenuOrder(raw.quick_menu_order as string[])
      : defaultSession.quick_menu_order,
    member_ipl_slot:
      raw.member_ipl_slot === 'lapor' || raw.member_ipl_slot === 'informasi'
        ? raw.member_ipl_slot
        : defaultSession.member_ipl_slot,
    current_ipl_amount:
      typeof raw.current_ipl_amount === 'number'
        ? raw.current_ipl_amount
        : defaultSession.current_ipl_amount,
    prefer_retail_quick_slot:
      typeof raw.prefer_retail_quick_slot === 'boolean'
        ? raw.prefer_retail_quick_slot
        : defaultSession.prefer_retail_quick_slot,
  }
}

function partializeSession(s: SessionState): Partial<UserSession> {
  const {
    is_parent,
    can_view_billing,
    full_name,
    nik_masked,
    kk_masked,
    no_hp,
    block,
    housing_name,
    address,
    occupancy_type,
    residence_start_date,
    residence_end_date,
    foto_profil_url,
    religion,
    billing_status,
    current_ipl_amount,
    prefer_retail_quick_slot,
    quick_menu_order,
    member_ipl_slot,
    server_time_iso,
    token_expires_at,
  } = s
  return {
    is_parent,
    can_view_billing,
    full_name,
    nik_masked,
    kk_masked,
    no_hp,
    block,
    housing_name,
    address,
    occupancy_type,
    residence_start_date,
    residence_end_date,
    foto_profil_url,
    religion,
    billing_status,
    current_ipl_amount,
    prefer_retail_quick_slot,
    quick_menu_order,
    member_ipl_slot,
    server_time_iso,
    token_expires_at,
  }
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...defaultSession,
      setFromServer: (patch) => set(patch),
      renewSessionExpiry: () =>
        set({ token_expires_at: Date.now() + THIRTY_DAYS_MS }),
      logoutLocal: () => {
        try {
          localStorage.removeItem('warga-user-session')
          localStorage.removeItem('warga-session-flags')
        } catch {
          /* ignore */
        }
        set({ ...defaultSession })
      },
    }),
    {
      name: 'warga-user-session',
      version: 3,
      partialize: (s) => partializeSession(s),
      merge: (persisted, current) => ({
        ...current,
        ...migratePersistedSession(
          (persisted ?? {}) as Partial<UserSession> & Record<string, unknown>,
        ),
      }),
      migrate: (persisted) =>
        migratePersistedSession(
          (persisted ?? {}) as Partial<UserSession> & Record<string, unknown>,
        ),
    },
  ),
)

export function isSessionExpired(): boolean {
  const t = useSessionStore.getState().token_expires_at
  if (t == null) return false
  return Date.now() > t
}

/** Toggle demo anggota vs wali (profil dev). */
export function applyMemberDemoProfile(): void {
  useSessionStore.setState((s) => ({
    ...s,
    ...memberDemoPatch,
  }))
}

export function applyParentDemoProfile(): void {
  useSessionStore.setState({
    ...parentDemoSession,
    token_expires_at: Date.now() + THIRTY_DAYS_MS,
  })
}
