import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getResident, type ResidentDetail } from '@/api/admin'
import { ResidentAccountForm } from '@/components/users/ResidentAccountForm'
import { Button } from '@/components/ui/button'

export function ResidentAccountPage() {
  const { id } = useParams<{ id: string }>()
  const [resident, setResident] = useState<ResidentDetail | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void getResident(id)
      .then((data) => {
        setResident(data)
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [id])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" render={<Link to="/users" />}>
          <ArrowLeft className="mr-1 size-4" />
          Daftar warga
        </Button>
        {resident ? (
          <Button variant="outline" size="sm" render={<Link to={`/users/${resident.id}/edit`} />}>
            Edit data warga
          </Button>
        ) : null}
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Akun login warga</h1>
        {resident ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {resident.nama} · {resident.housing_name}
          </p>
        ) : null}
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
        <ResidentAccountForm resident={resident} onUpdated={setResident} />
      ) : !loadErr ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : null}
    </div>
  )
}
