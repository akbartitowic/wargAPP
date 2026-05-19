import { useEffect, useState } from 'react'
import { getWilayahChain, type WilayahOption } from '@/api/wilayah'
import { WilayahSearchCombobox } from '@/components/wilayah/WilayahSearchCombobox'

export type WilayahAddressValue = {
  kelurahan_kode: string
  kecamatan: string
  kelurahan: string
  kode_pos: string
}

type Props = {
  kelurahanKode?: string | null
  onChange: (value: WilayahAddressValue | null) => void
  disabled?: boolean
}

export function WilayahAddressPicker({ kelurahanKode, onChange, disabled }: Props) {
  const [provinsi, setProvinsi] = useState<WilayahOption | null>(null)
  const [kabupaten, setKabupaten] = useState<WilayahOption | null>(null)
  const [kecamatan, setKecamatan] = useState<WilayahOption | null>(null)
  const [kelurahan, setKelurahan] = useState<WilayahOption | null>(null)
  const [kodePos, setKodePos] = useState('')

  function emit(
    kel: WilayahOption | null,
    kec: WilayahOption | null,
    kp: string,
  ) {
    if (!kel || !kec || kp.length !== 5) {
      onChange(null)
      return
    }
    onChange({
      kelurahan_kode: kel.kode,
      kecamatan: kec.nama,
      kelurahan: kel.nama,
      kode_pos: kp,
    })
  }

  useEffect(() => {
    if (!kelurahanKode) return
    void getWilayahChain(kelurahanKode)
      .then((chain) => {
        setProvinsi(chain.provinsi)
        setKabupaten(chain.kabupaten)
        setKecamatan(chain.kecamatan)
        setKelurahan(chain.kelurahan)
        const kp = chain.kode_pos ?? ''
        setKodePos(kp)
        emit(chain.kelurahan, chain.kecamatan, kp)
      })
      .catch(() => {
        /* chain load failed — user can re-pick */
      })
  }, [kelurahanKode])

  function onProvinsiChange(v: WilayahOption | null) {
    setProvinsi(v)
    setKabupaten(null)
    setKecamatan(null)
    setKelurahan(null)
    setKodePos('')
    onChange(null)
  }

  function onKabupatenChange(v: WilayahOption | null) {
    setKabupaten(v)
    setKecamatan(null)
    setKelurahan(null)
    setKodePos('')
    onChange(null)
  }

  function onKecamatanChange(v: WilayahOption | null) {
    setKecamatan(v)
    setKelurahan(null)
    setKodePos('')
    onChange(null)
  }

  function onKelurahanChange(v: WilayahOption | null) {
    setKelurahan(v)
    const kp = v?.kodepos ?? ''
    setKodePos(kp)
    emit(v, kecamatan, kp)
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <WilayahSearchCombobox
        label="Provinsi"
        value={provinsi}
        onChange={onProvinsiChange}
        disabled={disabled}
        required
      />
      <WilayahSearchCombobox
        label="Kabupaten / Kota"
        parentKode={provinsi?.kode ?? null}
        value={kabupaten}
        onChange={onKabupatenChange}
        disabled={disabled}
        required
      />
      <WilayahSearchCombobox
        label="Kecamatan"
        parentKode={kabupaten?.kode ?? null}
        value={kecamatan}
        onChange={onKecamatanChange}
        disabled={disabled}
        required
      />
      <WilayahSearchCombobox
        label="Kelurahan / Desa"
        parentKode={kecamatan?.kode ?? null}
        value={kelurahan}
        onChange={onKelurahanChange}
        disabled={disabled}
        required
      />
      <label className="text-sm md:col-span-2">
        Kode pos (otomatis)
        <input
          value={kodePos}
          readOnly
          className="mt-1 w-full max-w-xs rounded-md border bg-muted px-2 py-1.5 font-mono text-muted-foreground"
        />
      </label>
      {kecamatan && kelurahan ? (
        <p className="text-xs text-muted-foreground md:col-span-2">
          Ringkasan: {kelurahan.nama}, Kec. {kecamatan.nama}, {kodePos}
        </p>
      ) : null}
    </div>
  )
}
