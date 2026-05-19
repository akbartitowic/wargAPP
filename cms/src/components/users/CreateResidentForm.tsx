import { useEffect, useMemo, useState } from 'react'
import { createResident, type HousingWilayah, type ResidentRow } from '@/api/admin'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AGAMA_OPTIONS } from '@/lib/parseResidentForm'
import type { OccupancyType } from '@/lib/residentOccupancy'
import { OccupancyFields, validateOccupancyFields } from '@/components/users/OccupancyFields'
import {
  OwnerParentSelect,
  validateKontrakOwner,
  type PemilikOption,
} from '@/components/users/OwnerParentSelect'
import {
  AddressRegistrationSection,
  type AddressMode,
  type KkMode,
} from '@/components/users/AddressRegistrationSection'

type Role = 'wali' | 'anggota'

export type HousingOption = { id: string; name: string } & HousingWilayah

type Props = {
  families: ResidentRow[]
  isSuperAdmin: boolean
  defaultHousingId: string | null
  housingOptions: HousingOption[]
  defaultWilayah: HousingWilayah | null
  onCreated: () => void
}

export function CreateResidentForm({
  families,
  isSuperAdmin,
  defaultHousingId,
  housingOptions,
  defaultWilayah,
  onCreated,
}: Props) {
  const [housingId, setHousingId] = useState(defaultHousingId ?? '')
  const [wilayah, setWilayah] = useState<HousingWilayah | null>(defaultWilayah)
  const [addressMode, setAddressMode] = useState<AddressMode>('new')
  const [allowsMultipleKk, setAllowsMultipleKk] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [kkMode, setKkMode] = useState<KkMode>('new_kk')
  const [selectedJoinNoKk, setSelectedJoinNoKk] = useState('')

  const [nik, setNik] = useState('')
  const [noKkWali, setNoKkWali] = useState('')
  const [nama, setNama] = useState('')
  const [noHp, setNoHp] = useState('')
  const [namaJalan, setNamaJalan] = useState('')
  const [blokRumah, setBlokRumah] = useState('')
  const [rt, setRt] = useState('')
  const [rw, setRw] = useState('')
  const [password, setPassword] = useState('')
  const [agama, setAgama] = useState<(typeof AGAMA_OPTIONS)[number]>('Islam')
  const [occupancyType, setOccupancyType] = useState<OccupancyType>('pemilik')
  const [residenceStart, setResidenceStart] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [residenceEnd, setResidenceEnd] = useState('')
  const [ownerResidentId, setOwnerResidentId] = useState('')

  const [msg, setMsg] = useState<string | null>(null)
  const [msgOk, setMsgOk] = useState(false)
  const [saving, setSaving] = useState(false)

  const effectiveHousingId = isSuperAdmin ? housingId : defaultHousingId

  const registrationRole: Role = useMemo(() => {
    if (addressMode === 'existing') {
      return kkMode === 'join_kk' ? 'anggota' : 'wali'
    }
    return 'wali'
  }, [addressMode, kkMode])

  useEffect(() => {
    if (isSuperAdmin) {
      const found = housingOptions.find((h) => h.id === housingId)
      setWilayah(found ? { kecamatan: found.kecamatan, kelurahan: found.kelurahan, kode_pos: found.kode_pos } : null)
    } else if (defaultWilayah) {
      setWilayah(defaultWilayah)
    }
  }, [housingId, housingOptions, isSuperAdmin, defaultWilayah])

  const pemilikOptions: PemilikOption[] = useMemo(
    () =>
      families
        .filter((f) => f.occupancy_type === 'pemilik' && f.status === 'active')
        .map((f) => ({ id: f.id, nama: f.nama, blok_rumah: f.blok_rumah })),
    [families],
  )

  useEffect(() => {
    if (occupancyType !== 'kontrak') {
      setOwnerResidentId('')
    }
  }, [occupancyType])

  useEffect(() => {
    setSelectedUnitId('')
    setSelectedJoinNoKk('')
    setKkMode('new_kk')
  }, [effectiveHousingId])

  useEffect(() => {
    if (occupancyType === 'kontrak' && addressMode === 'new') {
      setAddressMode('existing')
    }
  }, [occupancyType, addressMode])

  const existingWaliForKk = useMemo(() => {
    if (registrationRole !== 'wali' || noKkWali.length !== 16) return null
    const atUnit = families.filter(
      (f) =>
        f.no_kk === noKkWali &&
        (addressMode === 'existing'
          ? f.housing_unit_id === selectedUnitId
          : true),
    )
    return atUnit.some((f) => f.is_parent) ? { waliName: atUnit.find((f) => f.is_parent)?.nama } : null
  }, [registrationRole, noKkWali, families, addressMode, selectedUnitId])

  function validate(): string | null {
    const nikDigits = nik.replace(/\D/g, '')
    if (nikDigits.length !== 16) return 'NIK harus tepat 16 digit angka.'
    if (nama.trim().length < 2) return 'Nama minimal 2 karakter.'
    if (!/^08\d{8,11}$/.test(noHp.replace(/\s/g, ''))) {
      return 'No. HP tidak valid (format 08xxxxxxxxxx).'
    }
    if (password.length < 8) return 'Password minimal 8 karakter.'

    const targetHousing = isSuperAdmin ? housingId : defaultHousingId
    if (!targetHousing) {
      return 'Pilih perumahan tujuan.'
    }

    if (!wilayah?.kecamatan || !wilayah.kelurahan || !wilayah.kode_pos) {
      return 'Data kecamatan/kelurahan/kode pos perumahan belum lengkap. Lengkapi di menu Perumahan.'
    }
    if (!namaJalan.trim()) return 'Nama jalan wajib diisi.'
    if (!blokRumah.trim()) return 'Blok rumah wajib diisi.'
    if (!rt.trim()) return 'RT wajib diisi.'
    if (!rw.trim()) return 'RW wajib diisi.'

    if (addressMode === 'existing' && !selectedUnitId) {
      return 'Pilih alamat yang sudah terdaftar.'
    }

    if (occupancyType === 'kontrak' && registrationRole === 'wali') {
      return 'Warga kontrak tidak dapat didaftarkan sebagai kepala keluarga (wali).'
    }

    if (registrationRole === 'wali') {
      const kk = noKkWali.replace(/\D/g, '')
      if (kk.length !== 16) return 'No. KK wajib 16 digit untuk kepala keluarga baru.'
      if (existingWaliForKk) {
        return `No. KK ini sudah memiliki wali (${existingWaliForKk.waliName}). Gunakan KK lain atau tambah sebagai anggota.`
      }
    } else if (!selectedJoinNoKk) {
      return 'Pilih KK tujuan di alamat yang dipilih.'
    }

    const occErr = validateOccupancyFields(occupancyType, residenceStart, residenceEnd)
    if (occErr) return occErr
    const ownerErr = validateKontrakOwner(
      occupancyType,
      ownerResidentId,
      pemilikOptions.length,
    )
    if (ownerErr) return ownerErr
    return null
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setMsgOk(false)

    const err = validate()
    if (err) {
      setMsg(err)
      return
    }

    const payload = {
      ...(isSuperAdmin ? { housing_complex_id: housingId } : {}),
      ...(addressMode === 'existing' && selectedUnitId
        ? { housing_unit_id: selectedUnitId }
        : {}),
      ...(addressMode === 'new' ? { allows_multiple_kk: allowsMultipleKk } : {}),
      nik: nik.replace(/\D/g, ''),
      no_kk:
        registrationRole === 'wali'
          ? noKkWali.replace(/\D/g, '')
          : selectedJoinNoKk.replace(/\D/g, ''),
      nama: nama.trim(),
      no_hp: noHp.replace(/\s/g, ''),
      nama_jalan: namaJalan.trim(),
      blok_rumah: blokRumah.trim(),
      rt: rt.trim(),
      rw: rw.trim(),
      agama,
      password,
      is_parent: registrationRole === 'wali',
      occupancy_type: occupancyType,
      residence_start_date: residenceStart,
      residence_end_date:
        occupancyType === 'kontrak' ? residenceEnd : null,
      owner_resident_id: occupancyType === 'kontrak' ? ownerResidentId : null,
    }

    setSaving(true)
    try {
      await createResident(payload)
      setMsg(
        registrationRole === 'wali'
          ? 'Kepala keluarga berhasil didaftarkan.'
          : 'Anggota keluarga berhasil ditambahkan.',
      )
      setMsgOk(true)
      setNik('')
      setNama('')
      setNoHp('')
      setPassword('')
      setNoKkWali('')
      setNamaJalan('')
      setBlokRumah('')
      setRt('')
      setRw('')
      setSelectedUnitId('')
      setSelectedJoinNoKk('')
      setAddressMode('new')
      setOwnerResidentId('')
      onCreated()
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tambah warga</CardTitle>
        <CardDescription>
          Tagihan IPL satu per alamat. Daftarkan alamat baru atau gabung ke alamat yang sudah ada;
          jika alamat multi-KK, Anda dapat menambah KK kedua (wali tetap melihat tagihan yang sama).
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit} className="space-y-5 p-6 pt-0">
        {msg ? (
          <p
            className={`rounded-md border px-3 py-2 text-sm ${
              msgOk
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
            role="alert"
          >
            {msg}
          </p>
        ) : null}

        {isSuperAdmin ? (
          <label className="block text-sm">
            Perumahan
            <select
              value={housingId}
              onChange={(e) => {
                setHousingId(e.target.value)
                setSelectedUnitId('')
              }}
              required
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            >
              <option value="">— Pilih perumahan —</option>
              {housingOptions.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {effectiveHousingId ? (
          <AddressRegistrationSection
            housingId={effectiveHousingId}
            addressMode={addressMode}
            onAddressModeChange={setAddressMode}
            allowsMultipleKk={allowsMultipleKk}
            onAllowsMultipleKkChange={setAllowsMultipleKk}
            selectedUnitId={selectedUnitId}
            onSelectedUnitIdChange={setSelectedUnitId}
            kkMode={kkMode}
            onKkModeChange={setKkMode}
            selectedJoinNoKk={selectedJoinNoKk}
            onSelectedJoinNoKkChange={setSelectedJoinNoKk}
            namaJalan={namaJalan}
            onNamaJalanChange={setNamaJalan}
            blokRumah={blokRumah}
            onBlokRumahChange={setBlokRumah}
            rt={rt}
            onRtChange={setRt}
            rw={rw}
            onRwChange={setRw}
            addressReadOnly={addressMode === 'existing'}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Pilih perumahan terlebih dahulu.</p>
        )}

        {registrationRole === 'wali' ? (
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
            <label className="text-sm">
              No. KK
              <input
                value={noKkWali}
                onChange={(e) => setNoKkWali(e.target.value.replace(/\D/g, '').slice(0, 16))}
                required
                inputMode="numeric"
                placeholder="16 digit"
                className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 font-mono"
              />
            </label>
            {existingWaliForKk ? (
              <p className="text-sm text-destructive md:col-span-2">
                KK ini sudah terdaftar dengan wali: <strong>{existingWaliForKk.waliName}</strong>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground md:col-span-2">
                Kepala keluarga (wali) mendapat akses melihat &amp; membayar tagihan IPL alamat ini.
              </p>
            )}
          </div>
        ) : null}

        {wilayah ? (
          <div className="grid gap-3 rounded-lg border border-dashed p-4 md:grid-cols-3">
            <label className="text-sm">
              Kelurahan
              <input
                value={wilayah.kelurahan}
                readOnly
                className="mt-1 w-full rounded-md border bg-muted px-2 py-1.5 text-muted-foreground"
              />
            </label>
            <label className="text-sm">
              Kecamatan
              <input
                value={wilayah.kecamatan}
                readOnly
                className="mt-1 w-full rounded-md border bg-muted px-2 py-1.5 text-muted-foreground"
              />
            </label>
            <label className="text-sm">
              Kode pos
              <input
                value={wilayah.kode_pos}
                readOnly
                className="mt-1 w-full rounded-md border bg-muted px-2 py-1.5 font-mono text-muted-foreground"
              />
            </label>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            NIK
            <input
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
              required
              inputMode="numeric"
              placeholder="16 digit"
              className="mt-1 w-full rounded-md border px-2 py-1.5 font-mono"
            />
          </label>
          <label className="text-sm">
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
              placeholder="081234567890"
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            Password login Warga App
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Warga login dengan NIK atau No. HP di atas beserta password ini.
            </span>
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
        </div>

        <OccupancyFields
          occupancyType={occupancyType}
          onOccupancyTypeChange={setOccupancyType}
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
          />
        ) : null}

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Menyimpan…' : registrationRole === 'wali' ? 'Simpan kepala keluarga' : 'Simpan anggota'}
        </Button>
      </form>
    </Card>
  )
}
