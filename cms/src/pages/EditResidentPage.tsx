import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getResident, listResidents, type ResidentDetail } from '@/api/admin'
import type { PemilikOption } from '@/components/users/OwnerParentSelect'
import { EditResidentForm } from '@/components/users/EditResidentForm'
import { Button } from '@/components/ui/button'

export function EditResidentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [resident, setResident] = useState<ResidentDetail | null>(null)
  const [pemilikOptions, setPemilikOptions] = useState<PemilikOption[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void getResident(id)
      .then((row) => {
        setResident(row)
        setLoadErr(null)
        return listResidents(row.housing_complex_id)
      })
      .then((rows) => {
        if (!rows) return
        setPemilikOptions(
          rows
            .filter((r) => r.occupancy_type === 'pemilik' && r.status === 'active')
            .map((r) => ({ id: r.id, nama: r.nama, blok_rumah: r.blok_rumah })),
        )
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [id])

  if (!id) {
    return <p className="text-sm text-destructive">ID warga tidak valid.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" render={<Link to="/users" />}>
          <ArrowLeft className="mr-1 size-4" />
          Kembali ke daftar
        </Button>
        {resident ? (
          <Button
            variant="secondary"
            size="sm"
            render={<Link to={`/users/${resident.id}/account`} />}
          >
            Kelola akun login
          </Button>
        ) : null}
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Edit data warga</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui profil, alamat unit, atau status kepala keluarga.
        </p>
      </div>

      {loadErr ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {loadErr}
        </p>
      ) : null}

      {resident ? (
        <EditResidentForm
          resident={resident}
          pemilikOptions={pemilikOptions}
          onSaved={() => navigate('/users')}
          onCancel={() => navigate('/users')}
        />
      ) : loadErr ? null : (
        <p className="text-sm text-muted-foreground">Memuat data…</p>
      )}
    </div>
  )
}
