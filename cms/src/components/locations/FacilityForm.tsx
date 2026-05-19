import { ImagePlus } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  FACILITY_TYPES,
  uploadFacilityImage,
  type FacilityPayload,
  type FacilityRow,
} from '@/api/facilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type FacilityFormValues = FacilityPayload

function toTimeHHMM(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const m = trimmed.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

type Props = {
  initial?: Partial<FacilityRow> & { housing_complex_id?: string }
  housingOptions?: { id: string; name: string }[]
  isSuperAdmin: boolean
  defaultHousingId: string | null
  mode?: 'create' | 'edit'
  onSubmit: (values: FacilityFormValues) => Promise<void>
  onCancel: () => void
  submitLabel: string
}

export function FacilityForm({
  initial,
  housingOptions,
  isSuperAdmin,
  defaultHousingId,
  mode = 'create',
  onSubmit,
  onCancel,
  submitLabel,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [housingId, setHousingId] = useState(
    initial?.housing_complex_id ?? defaultHousingId ?? housingOptions?.[0]?.id ?? '',
  )
  const [name, setName] = useState(initial?.name ?? '')
  const [facilityType, setFacilityType] = useState(initial?.facility_type ?? FACILITY_TYPES[0])
  const [description, setDescription] = useState(initial?.description ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [preview, setPreview] = useState<string | null>(initial?.image_url ?? null)
  const [openTime, setOpenTime] = useState(
    () => toTimeHHMM(initial?.open_time ?? '06:00') ?? '06:00',
  )
  const [closeTime, setCloseTime] = useState(
    () => toTimeHHMM(initial?.close_time ?? '22:00') ?? '22:00',
  )
  const [latitude, setLatitude] = useState(String(initial?.latitude ?? -6.2615))
  const [longitude, setLongitude] = useState(String(initial?.longitude ?? 106.7829))
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0))
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgOk, setMsgOk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function onImage(file: File | undefined) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const { url } = await uploadFacilityImage(file)
      setImageUrl(url)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    setMsgOk(false)
    try {
      if (mode === 'create' && isSuperAdmin && !housingId) {
        setMsg('Pilih perumahan terlebih dahulu.')
        return
      }
      const lat = Number(latitude)
      const lng = Number(longitude)
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        setMsg('Latitude dan longitude harus angka yang valid.')
        return
      }
      await onSubmit({
        ...(mode === 'create' && isSuperAdmin && housingId
          ? { housing_complex_id: housingId }
          : {}),
        name: name.trim(),
        facility_type: facilityType,
        description: description.trim() || null,
        image_url: imageUrl || null,
        address: address.trim() || null,
        latitude: lat,
        longitude: lng,
        open_time: toTimeHHMM(openTime),
        close_time: toTimeHHMM(closeTime),
        is_active: isActive,
        sort_order: Number(sortOrder) || 0,
      })
      setMsgOk(true)
      setMsg('Perubahan berhasil disimpan.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {msg ? (
        <p
          className={`text-sm ${msgOk ? 'text-green-800' : 'text-destructive'}`}
          role="alert"
        >
          {msg}
        </p>
      ) : null}

      {isSuperAdmin && housingOptions?.length ? (
        <label className="block text-sm">
          Perumahan
          <select
            value={housingId}
            onChange={(e) => setHousingId(e.target.value)}
            required
            className="mt-1 w-full max-w-md rounded-md border px-2 py-1.5"
          >
            <option value="">— Pilih —</option>
            {housingOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <Label>Foto fasilitas</Label>
          <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
            {preview ? (
              <img src={preview} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Belum ada foto
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onImage(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <ImagePlus className="mr-2 size-4" />
            {uploading ? 'Mengunggah…' : 'Unggah foto'}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nama fasilitas *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Jenis *</Label>
            <select
              value={facilityType}
              onChange={(e) => setFacilityType(e.target.value)}
              className="w-full rounded-md border px-2 py-1.5 text-sm"
            >
              {FACILITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Urutan tampil</Label>
            <Input
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Detail lokasi</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Fasilitas, aturan penggunaan, catatan akses…"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Alamat</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Jam buka</Label>
            <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Jam tutup</Label>
            <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Latitude *</Label>
            <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Longitude *</Label>
            <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Tampil di aplikasi warga
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? 'Menyimpan…' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  )
}
