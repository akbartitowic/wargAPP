import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getHousingComplex, updateHousingComplex } from '@/api/admin'
import { HousingForm, type HousingFormValues } from '@/components/housing/HousingForm'
import { Button } from '@/components/ui/button'

export function EditHousingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [initial, setInitial] = useState<{
    name: string
    slug: string
    address: string | null
    kelurahan_kode: string | null
    status: 'active' | 'inactive'
  } | null>(null)

  useEffect(() => {
    if (!id) return
    void getHousingComplex(id)
      .then((row) => {
        setInitial({
          name: row.name,
          slug: row.slug,
          address: row.address,
          kelurahan_kode: row.kelurahan_kode,
          status: row.status,
        })
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [id])

  async function onSubmit(values: HousingFormValues) {
    if (!id) return
    setSaving(true)
    try {
      await updateHousingComplex(id, {
        name: values.name,
        slug: values.slug,
        address: values.address,
        kelurahan_kode: values.kelurahan_kode,
        status: values.status,
      })
      navigate('/housing')
    } finally {
      setSaving(false)
    }
  }

  if (!id) {
    return <p className="text-sm text-destructive">ID perumahan tidak valid.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" render={<Link to="/housing" />}>
          <ArrowLeft className="mr-1 size-4" />
          Kembali ke daftar
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Edit perumahan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui data tenant perumahan dan wilayah administrasi.
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

      {initial ? (
        <HousingForm
          mode="edit"
          title={initial.name}
          description="Perubahan wilayah memengaruhi alamat otomatis saat mendaftarkan warga."
          initial={initial}
          saving={saving}
          onSubmit={onSubmit}
          onCancel={() => navigate('/housing')}
        />
      ) : loadErr ? null : (
        <p className="text-sm text-muted-foreground">Memuat data…</p>
      )}
    </div>
  )
}
