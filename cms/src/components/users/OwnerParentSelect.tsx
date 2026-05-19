import { Label } from '@/components/ui/label'

export type PemilikOption = {
  id: string
  nama: string
  blok_rumah: string
}

type Props = {
  options: PemilikOption[]
  value: string
  onChange: (id: string) => void
  excludeId?: string
}

export function OwnerParentSelect({ options, value, onChange, excludeId }: Props) {
  const filtered = excludeId ? options.filter((o) => o.id !== excludeId) : options

  return (
    <label className="block text-sm md:col-span-2">
      <Label className="mb-1 block">Pemilik (parent) *</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 w-full max-w-md rounded-md border bg-background px-2 py-1.5"
      >
        <option value="">— Pilih pemilik —</option>
        {filtered.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nama} · Blok {o.blok_rumah}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs text-muted-foreground">
        Warga kontrak wajib terhubung ke pemilik aktif di perumahan yang sama.
      </span>
    </label>
  )
}

export function validateKontrakOwner(
  occupancyType: string,
  ownerResidentId: string,
  pemilikCount: number,
): string | null {
  if (occupancyType !== 'kontrak') return null
  if (!ownerResidentId) return 'Pilih pemilik (parent) untuk warga kontrak.'
  if (pemilikCount === 0) {
    return 'Belum ada warga pemilik aktif di perumahan ini. Daftarkan pemilik terlebih dahulu.'
  }
  return null
}
