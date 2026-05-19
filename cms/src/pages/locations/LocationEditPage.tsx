import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { listHousingComplexes } from '@/api/admin'
import { createFacility, getFacility, updateFacility } from '@/api/facilities'
import { FacilityForm, type FacilityFormValues } from '@/components/locations/FacilityForm'
import { getCmsSession } from '@/lib/cmsSession'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LocationCreatePage() {
  const session = getCmsSession()
  const navigate = useNavigate()
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!session.is_super_admin) return
    void listHousingComplexes()
      .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
      .catch(() => setHousingOptions([]))
  }, [session.is_super_admin])

  async function handleSubmit(values: FacilityFormValues) {
    const row = await createFacility(values)
    navigate(`/locations/${row.id}`)
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" render={<Link to="/locations" />}>
        <ArrowLeft className="mr-1 size-4" />
        Kembali
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah fasilitas umum</CardTitle>
          <CardDescription>Foto, detail, koordinat, dan jam operasional.</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <FacilityForm
            mode="create"
            isSuperAdmin={session.is_super_admin}
            defaultHousingId={session.housing_complex_id}
            housingOptions={housingOptions}
            submitLabel="Simpan fasilitas"
            onCancel={() => navigate('/locations')}
            onSubmit={handleSubmit}
          />
        </div>
      </Card>
    </div>
  )
}

export function LocationEditPage() {
  const { id } = useParams<{ id: string }>()
  const session = getCmsSession()
  const navigate = useNavigate()
  const [row, setRow] = useState<Awaited<ReturnType<typeof getFacility>> | null>(null)
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void getFacility(id)
      .then(setRow)
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [id])

  useEffect(() => {
    if (!session.is_super_admin) return
    void listHousingComplexes()
      .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
      .catch(() => setHousingOptions([]))
  }, [session.is_super_admin])

  async function handleSubmit(values: FacilityFormValues) {
    if (!id) return
    const updated = await updateFacility(id, values)
    setRow(updated)
  }

  if (loadErr) return <p className="text-sm text-destructive">{loadErr}</p>
  if (!row) return <p className="text-sm text-muted-foreground">Memuat…</p>

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" render={<Link to="/locations" />}>
        <ArrowLeft className="mr-1 size-4" />
        Daftar fasilitas
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{row.name}</CardTitle>
          <CardDescription>{row.facility_type} · {row.housing_name}</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <FacilityForm
            mode="edit"
            initial={{ ...row, housing_complex_id: row.housing_complex_id }}
            isSuperAdmin={session.is_super_admin}
            defaultHousingId={session.housing_complex_id}
            housingOptions={housingOptions}
            submitLabel="Simpan perubahan"
            onCancel={() => navigate('/locations')}
            onSubmit={handleSubmit}
          />
        </div>
      </Card>
    </div>
  )
}
