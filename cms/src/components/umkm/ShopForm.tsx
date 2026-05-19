import { ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { uploadUmkmImage, type ShopPayload, type UmkmShopRow } from '@/api/umkm'
import { listResidents, type ResidentRow } from '@/api/admin'
import { UMKM_SHOP_CATEGORIES } from '@/lib/umkmCategories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type ShopFormValues = ShopPayload & { housing_complex_id?: string }

type Props = {
  initial?: Partial<UmkmShopRow> & { housing_complex_id?: string }
  housingOptions?: { id: string; name: string }[]
  isSuperAdmin: boolean
  defaultHousingId: string | null
  onSubmit: (values: ShopFormValues) => Promise<void>
  onCancel: () => void
  submitLabel: string
}

export function ShopForm({
  initial,
  housingOptions,
  isSuperAdmin,
  defaultHousingId,
  onSubmit,
  onCancel,
  submitLabel,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [housingId, setHousingId] = useState(
    initial?.housing_complex_id ?? defaultHousingId ?? housingOptions?.[0]?.id ?? '',
  )
  const [ownerId, setOwnerId] = useState(initial?.owner_id ?? '')
  const [owners, setOwners] = useState<ResidentRow[]>([])
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? UMKM_SHOP_CATEGORIES[0])
  const [tagline, setTagline] = useState(initial?.tagline ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [preview, setPreview] = useState<string | null>(initial?.image_url ?? null)
  const [openTime, setOpenTime] = useState((initial?.open_time ?? '08:00').slice(0, 5))
  const [closeTime, setCloseTime] = useState((initial?.close_time ?? '20:00').slice(0, 5))
  const [latitude, setLatitude] = useState(String(initial?.latitude ?? -6.2615))
  const [longitude, setLongitude] = useState(String(initial?.longitude ?? 106.7829))
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'pending')
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const effectiveHousing = isSuperAdmin ? housingId : defaultHousingId

  useEffect(() => {
    if (!effectiveHousing) {
      setOwners([])
      return
    }
    void listResidents(effectiveHousing)
      .then(setOwners)
      .catch(() => setOwners([]))
  }, [effectiveHousing])

  async function onImage(file: File | undefined) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setMsg(null)
    try {
      const { url } = await uploadUmkmImage(file, 'shop')
      setImageUrl(url)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setSaving(true)
    try {
      await onSubmit({
        ...(isSuperAdmin ? { housing_complex_id: housingId } : {}),
        owner_id: ownerId || null,
        name: name.trim(),
        category,
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        image_url: imageUrl || null,
        open_time: openTime,
        close_time: closeTime,
        latitude: Number(latitude),
        longitude: Number(longitude),
        whatsapp: whatsapp.trim() || null,
        status,
      })
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
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
          <Label>Foto toko (cover)</Label>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border bg-muted">
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
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void onImage(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="mr-2 size-4" />
            {uploading ? 'Mengunggah…' : 'Unggah foto'}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shop-name">Nama toko *</Label>
              <Input
                id="shop-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Warung Bu Sari"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-cat">Kategori jualan *</Label>
              <select
                id="shop-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                required
              >
                {UMKM_SHOP_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-status">Status</Label>
              <select
                id="shop-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full rounded-md border px-2 py-1.5 text-sm"
              >
                <option value="pending">Menunggu persetujuan</option>
                <option value="approved">Aktif (tampil di app)</option>
                <option value="rejected">Ditolak</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shop-tagline">Tagline singkat</Label>
              <Input
                id="shop-tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Kopi susu & pastry segar"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shop-desc">Detail toko</Label>
              <textarea
                id="shop-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Ceritakan toko, jam sibuk, area layanan…"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="open">Jam buka</Label>
              <Input
                id="open"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close">Jam tutup</Label>
              <Input
                id="close"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa">WhatsApp pesanan</Label>
              <Input
                id="wa"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="081234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Pemilik (warga)</Label>
              <select
                id="owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full rounded-md border px-2 py-1.5 text-sm"
              >
                <option value="">— Opsional —</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nama} · Blok {o.blok_rumah}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
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
