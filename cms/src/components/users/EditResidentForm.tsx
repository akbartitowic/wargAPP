import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updateResident, type ResidentDetail } from '@/api/admin'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AGAMA_OPTIONS } from '@/lib/parseResidentForm'
import type { OccupancyType } from '@/lib/residentOccupancy'
import { formatResidenceDate, occupancyLabel } from '@/lib/residentOccupancy'
import { OccupancyFields, validateOccupancyFields } from '@/components/users/OccupancyFields'
import {
  OwnerParentSelect,
  validateKontrakOwner,
  type PemilikOption,
} from '@/components/users/OwnerParentSelect'

type Props = {
  resident: ResidentDetail
  pemilikOptions: PemilikOption[]
  onSaved: () => void
  onCancel: () => void
}

export function EditResidentForm({ resident, pemilikOptions, onSaved, onCancel }: Props) {
  const [nama, setNama] = useState(resident.nama)
  const [noHp, setNoHp] = useState(resident.no_hp)
  const [namaJalan, setNamaJalan] = useState(resident.nama_jalan)
  const [blokRumah, setBlokRumah] = useState(resident.blok_rumah)
  const [rt, setRt] = useState(resident.rt)
  const [rw, setRw] = useState(resident.rw)
  const [agama, setAgama] = useState<(typeof AGAMA_OPTIONS)[number]>(
    AGAMA_OPTIONS.includes(resident.agama as (typeof AGAMA_OPTIONS)[number])
      ? (resident.agama as (typeof AGAMA_OPTIONS)[number])
      : 'Islam',
  )
  const [isParent, setIsParent] = useState(resident.is_parent)
  const [occupancyType, setOccupancyType] = useState<OccupancyType>(
    resident.occupancy_type === 'kontrak' ? 'kontrak' : 'pemilik',
  )
  const [residenceStart, setResidenceStart] = useState(resident.residence_start_date)
  const [residenceEnd, setResidenceEnd] = useState(resident.residence_end_date ?? '')
  const [ownerResidentId, setOwnerResidentId] = useState(resident.owner_resident_id ?? '')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (nama.trim().length < 2) {
      setMsg('Nama minimal 2 karakter.')
      return
    }
    if (!/^08\d{8,11}$/.test(noHp.replace(/\s/g, ''))) {
      setMsg('No. HP tidak valid (format 08xxxxxxxxxx).')
      return
    }
    if (!namaJalan.trim() || !blokRumah.trim() || !rt.trim() || !rw.trim()) {
      setMsg('Lengkapi alamat (nama jalan, blok, RT, RW).')
      return
    }
    if (password.length > 0 && password.length < 8) {
      setMsg('Password baru minimal 8 karakter.')
      return
    }
    const occErr = validateOccupancyFields(occupancyType, residenceStart, residenceEnd)
    if (occErr) {
      setMsg(occErr)
      return
    }
    if (occupancyType === 'kontrak' && isParent) {
      setMsg('Warga kontrak tidak dapat menjadi kepala keluarga (wali).')
      return
    }
    const ownerErr = validateKontrakOwner(
      occupancyType,
      ownerResidentId,
      pemilikOptions.length,
    )
    if (ownerErr) {
      setMsg(ownerErr)
      return
    }

    setSaving(true)
    try {
      await updateResident(resident.id, {
        nama: nama.trim(),
        no_hp: noHp.replace(/\s/g, ''),
        nama_jalan: namaJalan.trim(),
        blok_rumah: blokRumah.trim(),
        rt: rt.trim(),
        rw: rw.trim(),
        agama,
        is_parent: isParent,
        occupancy_type: occupancyType,
        residence_start_date: residenceStart,
        residence_end_date: occupancyType === 'kontrak' ? residenceEnd : null,
        owner_resident_id: occupancyType === 'kontrak' ? ownerResidentId : null,
        ...(password ? { password } : {}),
      })
      onSaved()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-4">
          {resident.foto_profil_url ? (
            <img
              src={resident.foto_profil_url}
              alt=""
              className="h-16 w-16 rounded-full border object-cover"
              width={64}
              height={64}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted text-lg font-semibold text-muted-foreground">
              {resident.nama.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{resident.nama}</CardTitle>
            <CardDescription className="mt-1">
              NIK dan No. KK tidak dapat diubah. Wilayah: {resident.housing_name}. Status akun:{' '}
              {resident.status === 'active' ? 'Aktif' : 'Nonaktif'} · Hunian:{' '}
              {occupancyLabel(resident.occupancy_type)} (mulai{' '}
              {formatResidenceDate(resident.residence_start_date)}
              {resident.occupancy_type === 'kontrak' && resident.residence_end_date
                ? `, selesai ${formatResidenceDate(resident.residence_end_date)}`
                : ''}
              ).
              {resident.foto_profil_url
                ? ' Foto profil diunggah warga dari aplikasi.'
                : ' Foto profil dapat diunggah warga di aplikasi.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={onSubmit} className="space-y-5 p-6 pt-0">
        {msg ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {msg}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            NIK
            <input
              value={resident.nik_masked}
              readOnly
              className="mt-1 w-full rounded-md border bg-muted px-2 py-1.5 font-mono text-muted-foreground"
            />
          </label>
          <label className="text-sm">
            No. KK
            <input
              value={resident.no_kk_masked}
              readOnly
              className="mt-1 w-full rounded-md border bg-muted px-2 py-1.5 font-mono text-muted-foreground"
            />
          </label>
          <label className="text-sm md:col-span-2">
            Perumahan
            <input
              value={resident.housing_name}
              readOnly
              className="mt-1 w-full rounded-md border bg-muted px-2 py-1.5 text-muted-foreground"
            />
          </label>
        </div>

        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">Alamat</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              Nama jalan
              <input
                value={namaJalan}
                onChange={(e) => setNamaJalan(e.target.value)}
                required
                className="mt-1 w-full rounded-md border px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              Blok rumah
              <input
                value={blokRumah}
                onChange={(e) => setBlokRumah(e.target.value)}
                required
                className="mt-1 w-full rounded-md border px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              RT
              <input
                value={rt}
                onChange={(e) => setRt(e.target.value.replace(/\D/g, '').slice(0, 3))}
                required
                className="mt-1 w-full rounded-md border px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              RW
              <input
                value={rw}
                onChange={(e) => setRw(e.target.value.replace(/\D/g, '').slice(0, 3))}
                required
                className="mt-1 w-full rounded-md border px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              Kelurahan
              <input
                value={resident.kelurahan}
                readOnly
                className="mt-1 w-full rounded-md border bg-muted px-2 py-1.5 text-muted-foreground"
              />
            </label>
            <label className="text-sm">
              Kecamatan
              <input
                value={resident.kecamatan}
                readOnly
                className="mt-1 w-full rounded-md border bg-muted px-2 py-1.5 text-muted-foreground"
              />
            </label>
            <label className="text-sm md:col-span-2">
              Kode pos
              <input
                value={resident.kode_pos}
                readOnly
                className="mt-1 w-full max-w-xs rounded-md border bg-muted px-2 py-1.5 font-mono text-muted-foreground"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Nama lengkap
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            No. HP
            <input
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              required
              inputMode="tel"
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            Agama
            <select
              value={agama}
              onChange={(e) => setAgama(e.target.value as (typeof AGAMA_OPTIONS)[number])}
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            >
              {AGAMA_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={isParent}
              disabled={occupancyType === 'kontrak'}
              onChange={(e) => setIsParent(e.target.checked)}
              className="size-4 rounded border disabled:opacity-50"
            />
            Kepala keluarga (wali) — mendapat akses tagihan IPL
            {occupancyType === 'kontrak' ? (
              <span className="text-xs text-muted-foreground">(tidak berlaku untuk kontrak)</span>
            ) : null}
          </label>
          <label className="text-sm md:col-span-2">
            Password login app (kosongkan jika tidak diubah)
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Atau kelola di halaman{' '}
              <Link
                to={`/users/${resident.id}/account`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Akun login
              </Link>
              .
            </span>
          </label>
        </div>

        <OccupancyFields
          occupancyType={occupancyType}
          onOccupancyTypeChange={(v) => {
            setOccupancyType(v)
            if (v === 'kontrak') setIsParent(false)
            else setOwnerResidentId('')
          }}
          residenceStart={residenceStart}
          onResidenceStartChange={setResidenceStart}
          residenceEnd={residenceEnd}
          onResidenceEndChange={setResidenceEnd}
        />

        {occupancyType === 'kontrak' ? (
          <OwnerParentSelect
            options={pemilikOptions}
            value={ownerResidentId}
            onChange={setOwnerResidentId}
            excludeId={resident.id}
          />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan perubahan'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Batal
          </Button>
        </div>
      </form>
    </Card>
  )
}
