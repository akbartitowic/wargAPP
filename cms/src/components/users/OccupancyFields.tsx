import {
  OCCUPANCY_OPTIONS,
  type OccupancyType,
  validateOccupancyDates,
} from '@/lib/residentOccupancy'
import { Label } from '@/components/ui/label'

type Props = {
  occupancyType: OccupancyType
  onOccupancyTypeChange: (v: OccupancyType) => void
  residenceStart: string
  onResidenceStartChange: (v: string) => void
  residenceEnd: string
  onResidenceEndChange: (v: string) => void
}

export function OccupancyFields({
  occupancyType,
  onOccupancyTypeChange,
  residenceStart,
  onResidenceStartChange,
  residenceEnd,
  onResidenceEndChange,
}: Props) {
  const isKontrak = occupancyType === 'kontrak'

  return (
    <div className="grid gap-3 rounded-lg border border-dashed p-4 md:grid-cols-2">
      <p className="text-sm font-medium md:col-span-2">Status hunian</p>
      <label className="text-sm">
        <Label className="mb-1 block">Jenis</Label>
        <select
          value={occupancyType}
          onChange={(e) => {
            const v = e.target.value as OccupancyType
            onOccupancyTypeChange(v)
            if (v === 'pemilik') onResidenceEndChange('')
          }}
          className="w-full rounded-md border bg-background px-2 py-1.5"
        >
          {OCCUPANCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <Label className="mb-1 block">Mulai tinggal</Label>
        <input
          type="date"
          value={residenceStart}
          onChange={(e) => onResidenceStartChange(e.target.value)}
          required
          className="w-full rounded-md border bg-background px-2 py-1.5"
        />
      </label>
      {isKontrak ? (
        <label className="text-sm md:col-span-2">
          <Label className="mb-1 block">Akhir tinggal (kontrak)</Label>
          <input
            type="date"
            value={residenceEnd}
            onChange={(e) => onResidenceEndChange(e.target.value)}
            required={isKontrak}
            min={residenceStart || undefined}
            className="w-full max-w-xs rounded-md border bg-background px-2 py-1.5"
          />
        </label>
      ) : null}
    </div>
  )
}

export function validateOccupancyFields(
  occupancyType: OccupancyType,
  residenceStart: string,
  residenceEnd: string,
): string | null {
  return validateOccupancyDates(occupancyType, residenceStart, residenceEnd)
}
