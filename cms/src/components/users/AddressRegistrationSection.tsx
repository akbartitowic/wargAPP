import { useEffect, useMemo, useState } from 'react'
import {
  listHousingUnits,
  listUnitKk,
  type HousingUnitRow,
  type UnitKkRow,
} from '@/api/admin'
import { Badge } from '@/components/ui/badge'

export type AddressMode = 'new' | 'existing'
export type KkMode = 'new_kk' | 'join_kk'

type Props = {
  housingId: string
  addressMode: AddressMode
  onAddressModeChange: (m: AddressMode) => void
  allowsMultipleKk: boolean
  onAllowsMultipleKkChange: (v: boolean) => void
  selectedUnitId: string
  onSelectedUnitIdChange: (id: string) => void
  kkMode: KkMode
  onKkModeChange: (m: KkMode) => void
  selectedJoinNoKk: string
  onSelectedJoinNoKkChange: (noKk: string) => void
  namaJalan: string
  onNamaJalanChange: (v: string) => void
  blokRumah: string
  onBlokRumahChange: (v: string) => void
  rt: string
  onRtChange: (v: string) => void
  rw: string
  onRwChange: (v: string) => void
  addressReadOnly?: boolean
}

export function AddressRegistrationSection({
  housingId,
  addressMode,
  onAddressModeChange,
  allowsMultipleKk,
  onAllowsMultipleKkChange,
  selectedUnitId,
  onSelectedUnitIdChange,
  kkMode,
  onKkModeChange,
  selectedJoinNoKk,
  onSelectedJoinNoKkChange,
  namaJalan,
  onNamaJalanChange,
  blokRumah,
  onBlokRumahChange,
  rt,
  onRtChange,
  rw,
  onRwChange,
  addressReadOnly = false,
}: Props) {
  const [units, setUnits] = useState<HousingUnitRow[]>([])
  const [unitSearch, setUnitSearch] = useState('')
  const [unitKks, setUnitKks] = useState<UnitKkRow[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)

  const selectedUnit = useMemo(
    () => units.find((u) => u.id === selectedUnitId) ?? null,
    [units, selectedUnitId],
  )

  useEffect(() => {
    if (!housingId) {
      setUnits([])
      return
    }
    void listHousingUnits(housingId, unitSearch)
      .then(setUnits)
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat alamat'))
  }, [housingId, unitSearch])

  useEffect(() => {
    if (!selectedUnitId) {
      setUnitKks([])
      return
    }
    void listUnitKk(selectedUnitId)
      .then((rows) => {
        setUnitKks(rows)
        if (rows.length === 0) onKkModeChange('new_kk')
        else if (!rows.some((r) => r.no_kk === selectedJoinNoKk)) {
          onSelectedJoinNoKkChange(rows[0]?.no_kk ?? '')
        }
      })
      .catch(() => setUnitKks([]))
  }, [selectedUnitId, selectedJoinNoKk, onKkModeChange, onSelectedJoinNoKkChange])

  useEffect(() => {
    if (!selectedUnit) return
    onNamaJalanChange(selectedUnit.nama_jalan)
    onBlokRumahChange(selectedUnit.blok_rumah)
    onRtChange(selectedUnit.rt)
    onRwChange(selectedUnit.rw)
  }, [selectedUnit, onNamaJalanChange, onBlokRumahChange, onRtChange, onRwChange])

  const canAddAnotherKk =
    addressMode === 'existing'
      ? Boolean(selectedUnit?.allows_multiple_kk)
      : allowsMultipleKk

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-semibold">Alamat &amp; tagihan IPL</p>
        <p className="text-xs text-muted-foreground">
          Satu tagihan IPL per alamat (bukan per KK). Jika satu rumah punya 2 KK, centang opsi
          multi-KK.
        </p>
      </div>

      {loadErr ? <p className="text-sm text-destructive">{loadErr}</p> : null}

      <fieldset className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="address_mode"
            checked={addressMode === 'new'}
            onChange={() => onAddressModeChange('new')}
          />
          Alamat baru
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="address_mode"
            checked={addressMode === 'existing'}
            onChange={() => onAddressModeChange('existing')}
          />
          Gabung alamat yang sudah ada
        </label>
      </fieldset>

      {addressMode === 'existing' ? (
        <div className="space-y-3">
          <label className="block text-sm">
            Cari alamat
            <input
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              placeholder="Blok, jalan, nama wali…"
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Pilih alamat
            <select
              value={selectedUnitId}
              onChange={(e) => onSelectedUnitIdChange(e.target.value)}
              required
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5"
            >
              <option value="">— Pilih —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Blok {u.blok_rumah} · {u.kk_count} KK
                  {u.allows_multiple_kk ? ' · multi-KK' : ''} · {u.wali_names}
                </option>
              ))}
            </select>
          </label>
          {selectedUnit ? (
            <p className="text-xs text-muted-foreground">
              {selectedUnit.alamat_lengkap}
              {selectedUnit.allows_multiple_kk ? (
                <Badge variant="secondary" className="ml-2">
                  Boleh &gt;1 KK
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2">
                  1 KK saja
                </Badge>
              )}
            </p>
          ) : null}

          {selectedUnit && unitKks.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">KK di alamat ini</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="kk_mode"
                  checked={kkMode === 'join_kk'}
                  onChange={() => onKkModeChange('join_kk')}
                />
                Tambah anggota ke KK yang ada
              </label>
              {kkMode === 'join_kk' ? (
                <select
                  value={selectedJoinNoKk}
                  onChange={(e) => onSelectedJoinNoKkChange(e.target.value)}
                  className="w-full max-w-md rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  {unitKks.map((k) => (
                    <option key={k.no_kk} value={k.no_kk}>
                      {k.wali_name} · {k.member_count} anggota
                    </option>
                  ))}
                </select>
              ) : null}
              {canAddAnotherKk ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="kk_mode"
                    checked={kkMode === 'new_kk'}
                    onChange={() => onKkModeChange('new_kk')}
                  />
                  Tambah KK baru di alamat ini
                </label>
              ) : (
                <p className="text-xs text-amber-700">
                  Alamat ini hanya untuk 1 KK. Untuk KK kedua, ubah pengaturan alamat di data
                  warga atau buat alamat baru dengan opsi multi-KK.
                </p>
              )}
            </fieldset>
          ) : selectedUnit && unitKks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada KK di alamat ini — warga pertama akan menjadi kepala keluarga (wali).
            </p>
          ) : null}
        </div>
      ) : (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowsMultipleKk}
            onChange={(e) => onAllowsMultipleKkChange(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Alamat dapat memiliki lebih dari 1 KK</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Centang jika satu rumah bisa dihuni beberapa kartu keluarga (tagihan IPL tetap 1 per
              alamat).
            </span>
          </span>
        </label>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          Nama jalan
          <input
            value={namaJalan}
            onChange={(e) => onNamaJalanChange(e.target.value)}
            readOnly={addressReadOnly}
            required
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 read-only:bg-muted"
          />
        </label>
        <label className="text-sm">
          Blok rumah
          <input
            value={blokRumah}
            onChange={(e) => onBlokRumahChange(e.target.value)}
            readOnly={addressReadOnly}
            required
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 read-only:bg-muted"
          />
        </label>
        <label className="text-sm">
          RT
          <input
            value={rt}
            onChange={(e) => onRtChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
            readOnly={addressReadOnly}
            required
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 read-only:bg-muted"
          />
        </label>
        <label className="text-sm">
          RW
          <input
            value={rw}
            onChange={(e) => onRwChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
            readOnly={addressReadOnly}
            required
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 read-only:bg-muted"
          />
        </label>
      </div>
    </div>
  )
}
