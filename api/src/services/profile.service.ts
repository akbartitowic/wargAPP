import { query } from '../config/database.js'
import { userRepository } from '../repositories/user.repository.js'
import { NotFoundError } from '../utils/errors.js'
import { formatAlamatLengkap } from '../utils/address.js'
import { maskSensitiveId } from '../utils/masking.js'
import { resolvePhotoUrl } from '../utils/media.js'

export async function getProfile(residentId: string) {
  const { rows } = await userRepository.findProfileById(residentId)
  const r = rows[0]
  if (!r) throw new NotFoundError('Profil tidak ditemukan')

  const alamat_lengkap = formatAlamatLengkap({
    nama_jalan: r.nama_jalan,
    blok_rumah: r.blok_rumah,
    rt: r.rt,
    rw: r.rw,
    kelurahan: r.kelurahan,
    kecamatan: r.kecamatan,
    kode_pos: r.kode_pos,
  })

  const residence_start_date = r.residence_start_date.toISOString().slice(0, 10)
  const residence_end_date = r.residence_end_date
    ? r.residence_end_date.toISOString().slice(0, 10)
    : null

  return {
    nik: maskSensitiveId(r.nik),
    nama: r.nama,
    no_kk: maskSensitiveId(r.no_kk),
    no_hp: r.no_hp,
    blok_rumah: r.blok_rumah,
    agama: r.agama,
    housing_name: r.housing_name,
    alamat_lengkap,
    occupancy_type: r.occupancy_type === 'kontrak' ? 'kontrak' : 'pemilik',
    residence_start_date,
    residence_end_date,
    foto_profil_url: resolvePhotoUrl(r.foto_profil_url),
    access_control: {
      is_parent: r.is_parent,
      can_view_billing: r.can_view_billing,
      can_manage_umkm: r.can_manage_umkm,
    },
  }
}

export async function updateProfile(
  residentId: string,
  patch: { no_hp?: string; foto_profil_url?: string | null },
) {
  await userRepository.updateProfile(residentId, patch)
  return getProfile(residentId)
}

export async function setProfilePhoto(residentId: string, relativePath: string) {
  await userRepository.updateProfile(residentId, {
    foto_profil_url: relativePath.replace(/^\//, ''),
  })
  return getProfile(residentId)
}

export async function listFamilyMembers(residentId: string) {
  const { rows: self } = await query<{ no_kk: string; housing_complex_id: string }>(
    `SELECT no_kk, housing_complex_id::text FROM residents
     WHERE id = $1 AND status = 'active' AND deleted_at IS NULL`,
    [residentId],
  )
  const me = self[0]
  if (!me) throw new NotFoundError('Profil tidak ditemukan')

  const { rows } = await query<{
    id: string
    nama: string
    is_parent: boolean
    blok_rumah: string
    agama: string
    foto_profil_url: string | null
  }>(
    `SELECT id::text, nama, is_parent, blok_rumah, agama::text, foto_profil_url
     FROM residents
     WHERE housing_complex_id = $1 AND no_kk = $2
       AND status = 'active' AND deleted_at IS NULL
     ORDER BY is_parent DESC, nama ASC`,
    [me.housing_complex_id, me.no_kk],
  )

  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    is_parent: r.is_parent,
    role_label: r.is_parent ? 'Kepala keluarga' : 'Anggota keluarga',
    blok_rumah: r.blok_rumah,
    agama: r.agama,
    foto_profil_url: resolvePhotoUrl(r.foto_profil_url),
    is_self: r.id === residentId,
  }))
}

export async function getSupportInfo(residentId: string) {
  const { rows } = await query<{
    housing_name: string
    housing_address: string | null
    kelurahan: string | null
    kecamatan: string | null
    kode_pos: string | null
  }>(
    `SELECT h.name AS housing_name, h.address AS housing_address,
            h.kelurahan, h.kecamatan, h.kode_pos
     FROM residents r
     JOIN housing_complexes h ON h.id = r.housing_complex_id
     WHERE r.id = $1 AND r.status = 'active' AND r.deleted_at IS NULL`,
    [residentId],
  )
  const h = rows[0]
  if (!h) throw new NotFoundError('Profil tidak ditemukan')

  return {
    housing_name: h.housing_name,
    housing_address: h.housing_address,
    wilayah: [h.kelurahan, h.kecamatan, h.kode_pos].filter(Boolean).join(', '),
    channels: [
      {
        key: 'lapor',
        label: 'Lapor darurat',
        description: 'Keadaan darurat, keamanan, atau gangguan lingkungan.',
        route: '/lapor',
      },
      {
        key: 'informasi',
        label: 'Informasi & pengumuman',
        description: 'Pengumuman resmi dari pengurus perumahan.',
        route: '/informasi',
      },
      {
        key: 'ipl',
        label: 'Tagihan IPL',
        description: 'Cek tagihan dan unggah bukti transfer (wali keluarga).',
        route: '/ipl',
      },
    ],
    faq: [
      {
        q: 'Bagaimana cara mengubah profil?',
        a: 'Buka Profil → Ubah profil untuk memperbarui foto dan nomor HP.',
      },
      {
        q: 'Siapa yang bisa melihat tagihan IPL?',
        a: 'Hanya kepala keluarga (wali) yang memiliki akses tagihan di aplikasi.',
      },
    ],
  }
}
