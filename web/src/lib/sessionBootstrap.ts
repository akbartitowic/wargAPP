import {
  fetchBillingCurrent,
  fetchHomeConfig,
  fetchProfile,
  mapQuickMenuKeys,
} from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import type { BillingStatus, Religion } from '@/store/sessionStore'
import { useSessionStore } from '@/store/sessionStore'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const religions: Religion[] = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Khonghucu',
  'Lainnya',
]

export async function bootstrapSessionFromApi(): Promise<void> {
  if (!isApiConfigured()) return

  const profile = await fetchProfile()
  const home = await fetchHomeConfig()

  let billing_status: BillingStatus = 'paid'
  let current_ipl_amount = 0

  if (
    profile.access_control.is_parent &&
    profile.access_control.can_view_billing
  ) {
    try {
      const bill = await fetchBillingCurrent()
      billing_status = bill.status as BillingStatus
      current_ipl_amount = bill.total_amount
    } catch {
      billing_status = 'unpaid'
    }
  }

  const religion = religions.includes(profile.agama as Religion)
    ? (profile.agama as Religion)
    : 'Islam'

  useSessionStore.getState().setFromServer({
    full_name: profile.nama,
    nik_masked: profile.nik,
    kk_masked: profile.no_kk,
    no_hp: profile.no_hp,
    block: profile.blok_rumah,
    housing_name: profile.housing_name,
    address: profile.alamat_lengkap,
    occupancy_type: profile.occupancy_type,
    residence_start_date: profile.residence_start_date,
    residence_end_date: profile.residence_end_date,
    foto_profil_url: profile.foto_profil_url,
    religion,
    is_parent: profile.access_control.is_parent,
    can_view_billing: profile.access_control.can_view_billing,
    billing_status,
    current_ipl_amount,
    quick_menu_order: mapQuickMenuKeys(home.quick_menu),
    server_time_iso: home.server_time_iso,
    token_expires_at: Date.now() + THIRTY_DAYS_MS,
  })
}

/** Sinkronkan profil setelah ubah foto / no HP di halaman edit. */
export async function refreshProfileInSession(): Promise<void> {
  if (!isApiConfigured()) return
  const profile = await fetchProfile()
  const religions: Religion[] = [
    'Islam',
    'Kristen',
    'Katolik',
    'Hindu',
    'Buddha',
    'Khonghucu',
    'Lainnya',
  ]
  const religion = religions.includes(profile.agama as Religion)
    ? (profile.agama as Religion)
    : 'Islam'

  useSessionStore.getState().setFromServer({
    full_name: profile.nama,
    nik_masked: profile.nik,
    kk_masked: profile.no_kk,
    no_hp: profile.no_hp,
    block: profile.blok_rumah,
    housing_name: profile.housing_name,
    address: profile.alamat_lengkap,
    occupancy_type: profile.occupancy_type,
    residence_start_date: profile.residence_start_date,
    residence_end_date: profile.residence_end_date,
    foto_profil_url: profile.foto_profil_url,
    religion,
  })
}
