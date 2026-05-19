import { useEffect, useState } from 'react'
import { slugifyPreview } from '@/lib/slugify'
import {
  WilayahAddressPicker,
  type WilayahAddressValue,
} from '@/components/wilayah/WilayahAddressPicker'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type HousingFormValues = {
  name: string
  slug: string
  address: string | null
  kelurahan_kode: string
  status?: 'active' | 'inactive'
}

type Props = {
  mode: 'create' | 'edit'
  title: string
  description: string
  initial?: {
    name: string
    slug: string
    address: string | null
    kelurahan_kode: string | null
    status?: 'active' | 'inactive'
  }
  saving?: boolean
  onSubmit: (values: HousingFormValues) => Promise<void>
  onCancel?: () => void
}

export function HousingForm({
  mode,
  title,
  description,
  initial,
  saving = false,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [status, setStatus] = useState<'active' | 'inactive'>(initial?.status ?? 'active')
  const [wilayah, setWilayah] = useState<WilayahAddressValue | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'create' && !slugTouched && name) {
      setSlug(slugifyPreview(name))
    }
  }, [name, slugTouched, mode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (!wilayah?.kelurahan_kode) {
      setMsg('Pilih provinsi hingga kelurahan/desa (wilayah administrasi).')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        slug: slug.trim() || slugifyPreview(name),
        address: address.trim() || null,
        kelurahan_kode: wilayah.kelurahan_kode,
        ...(mode === 'edit' ? { status } : {}),
      })
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menyimpan')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="grid gap-3 p-6 pt-0 md:grid-cols-2">
        {msg ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2"
            role="alert"
          >
            {msg}
          </p>
        ) : null}

        <label className="text-sm md:col-span-2">
          Nama perumahan
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Perumahan Griya Asri"
            className="mt-1 w-full rounded-md border px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          Slug
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }}
            required
            placeholder="griya-asri"
            className="mt-1 w-full rounded-md border px-2 py-1.5 font-mono text-sm"
          />
        </label>
        {mode === 'edit' ? (
          <label className="text-sm">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
        ) : (
          <div className="hidden md:block" />
        )}
        <label className="text-sm md:col-span-2">
          Alamat kantor / gerbang (opsional)
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Jl. ..."
            className="mt-1 w-full rounded-md border px-2 py-1.5"
          />
        </label>
        <div className="md:col-span-2 space-y-2 rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">Wilayah administrasi</p>
          <WilayahAddressPicker
            key={initial?.kelurahan_kode ?? 'new'}
            kelurahanKode={initial?.kelurahan_kode}
            onChange={setWilayah}
          />
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : mode === 'create' ? 'Simpan perumahan' : 'Simpan perubahan'}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Batal
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  )
}
