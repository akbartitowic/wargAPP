import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, KeyRound, Pencil } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ResidentRow } from '@/api/admin'
import { buildFamilyGroups, type FamilyGroup } from '@/lib/residentFamilies'
import { formatResidenceDate, occupancyLabel } from '@/lib/residentOccupancy'

export type { ResidentRow }

const COLS = {
  kk: 'No. KK',
  wali: 'Kepala keluarga (wali)',
  perumahan: 'Perumahan',
  blok: 'Blok',
  hunian: 'Hunian',
  mulai: 'Mulai tinggal',
  selesai: 'Akhir tinggal',
  akun: 'Akun',
  aksi: 'Aksi',
} as const

export function ResidentsByKkTable({ rows }: { rows: ResidentRow[] }) {
  const groups = useMemo(() => buildFamilyGroups(rows), [rows])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    const initial = new Set<string>()
    for (const g of groups) {
      if (g.members.length > 1) initial.add(g.no_kk)
    }
    setExpanded(initial)
  }, [groups])

  function toggle(no_kk: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(no_kk)) next.delete(no_kk)
      else next.add(no_kk)
      return next
    })
  }

  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data warga.</p>
    )
  }

  return (
    <table className="w-full min-w-[960px] text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="w-8 pb-2" aria-hidden />
          <th className="pb-2 pr-3">{COLS.kk}</th>
          <th className="pb-2 pr-3">{COLS.wali}</th>
          <th className="pb-2 pr-3">{COLS.perumahan}</th>
          <th className="pb-2 pr-3">{COLS.blok}</th>
          <th className="pb-2 pr-3">{COLS.hunian}</th>
          <th className="pb-2 pr-3">{COLS.mulai}</th>
          <th className="pb-2 pr-3">{COLS.selesai}</th>
          <th className="pb-2 pr-3">{COLS.akun}</th>
          <th className="pb-2 w-36">{COLS.aksi}</th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => {
          const multi = group.members.length > 1
          const open = expanded.has(group.no_kk)

          if (!multi) {
            return <FamilySummaryRow key={group.no_kk} group={group} showChevron={false} />
          }

          return (
            <GroupBlock
              key={group.no_kk}
              group={group}
              open={open}
              onToggle={() => toggle(group.no_kk)}
            />
          )
        })}
      </tbody>
    </table>
  )
}

function OccupancyBadge({ type }: { type: string }) {
  if (type === 'kontrak') {
    return <Badge variant="outline" className="text-xs">Kontrak</Badge>
  }
  return (
    <Badge variant="secondary" className="text-xs">
      Pemilik
    </Badge>
  )
}

function AccountStatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return <Badge className="bg-emerald-600/90 text-xs hover:bg-emerald-600/90">Aktif</Badge>
  }
  return (
    <Badge variant="secondary" className="text-xs">
      Nonaktif
    </Badge>
  )
}

function ResidentActions({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Button type="button" size="sm" variant="outline" render={<Link to={`/users/${id}/edit`} />}>
        <Pencil className="mr-1 size-3.5" />
        Edit
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        render={<Link to={`/users/${id}/account`} />}
      >
        <KeyRound className="mr-1 size-3.5" />
        Akun
      </Button>
    </div>
  )
}

function ResidentHunianCells({ member }: { member: ResidentRow }) {
  return (
    <>
      <td className="py-2.5">
        <OccupancyBadge type={member.occupancy_type} />
      </td>
      <td className="py-2.5 text-muted-foreground">
        {formatResidenceDate(member.residence_start_date)}
      </td>
      <td className="py-2.5 text-muted-foreground">
        {member.occupancy_type === 'kontrak'
          ? formatResidenceDate(member.residence_end_date)
          : '—'}
      </td>
      <td className="py-2.5">
        <AccountStatusBadge status={member.status} />
      </td>
    </>
  )
}

function FamilySummaryRow({
  group,
  showChevron,
  onToggle,
  open,
}: {
  group: FamilyGroup
  showChevron: boolean
  onToggle?: () => void
  open?: boolean
}) {
  const Chevron = open ? ChevronDown : ChevronRight
  const sole = group.members.length === 1 ? group.members[0] : null

  return (
    <tr
      className={
        showChevron
          ? 'cursor-pointer border-b border-border/60 bg-muted/30 hover:bg-muted/50'
          : 'border-b border-border/60'
      }
      onClick={showChevron ? onToggle : undefined}
    >
      <td className="py-2.5 pl-1">
        {showChevron ? (
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground"
            aria-expanded={open}
            aria-label={open ? 'Tutup anggota keluarga' : 'Tampilkan anggota keluarga'}
            onClick={(e) => {
              e.stopPropagation()
              onToggle?.()
            }}
          >
            <Chevron className="h-4 w-4" />
          </button>
        ) : null}
      </td>
      <td className="py-2.5 font-mono text-xs font-semibold">{group.no_kk_display}</td>
      <td className="py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{group.waliName}</span>
          {group.memberCount > 1 ? (
            <Badge variant="secondary">{group.memberCount} anggota</Badge>
          ) : null}
        </div>
      </td>
      <td className="py-2.5">{group.housing_name}</td>
      <td className="py-2.5">{group.blok_rumah}</td>
      {sole ? (
        <ResidentHunianCells member={sole} />
      ) : (
        <>
          <td colSpan={4} className="py-2.5 text-xs text-muted-foreground">
            Buka baris untuk detail hunian per anggota
          </td>
        </>
      )}
      <td className="py-2.5">{sole ? <ResidentActions id={sole.id} /> : null}</td>
    </tr>
  )
}

function GroupBlock({
  group,
  open,
  onToggle,
}: {
  group: FamilyGroup
  open: boolean
  onToggle: () => void
}) {
  return (
    <>
      <FamilySummaryRow group={group} showChevron open={open} onToggle={onToggle} />
      {open
        ? group.members.map((m) => (
            <tr key={m.id} className="border-b border-border/40 bg-background">
              <td />
              <td className="py-2 pl-2 text-xs text-muted-foreground">↳</td>
              <td colSpan={3} className="py-2 pl-1">
                <span className="font-medium">{m.nama}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="font-mono text-xs text-muted-foreground">{m.nik_masked}</span>
                {m.is_parent ? (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Wali
                  </Badge>
                ) : null}
                <span className="ml-2 text-xs text-muted-foreground">
                  {occupancyLabel(m.occupancy_type)}
                  {m.occupancy_type === 'kontrak' && m.owner_name
                    ? ` · Pemilik: ${m.owner_name}`
                    : ''}
                </span>
              </td>
              <ResidentHunianCells member={m} />
              <td className="py-2">
                <ResidentActions id={m.id} />
              </td>
            </tr>
          ))
        : null}
    </>
  )
}

