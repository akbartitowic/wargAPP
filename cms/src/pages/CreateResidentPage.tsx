import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getAdminMe, listHousingComplexes, listResidents, type HousingWilayah } from '@/api/admin'
import { CreateResidentForm, type HousingOption } from '@/components/users/CreateResidentForm'
import { Button } from '@/components/ui/button'
import { getCmsSession } from '@/lib/cmsSession'

export function CreateResidentPage() {
  const navigate = useNavigate()
  const session = getCmsSession()
  const [families, setFamilies] = useState<Awaited<ReturnType<typeof listResidents>>>([])
  const [housingOptions, setHousingOptions] = useState<HousingOption[]>([])
  const [defaultWilayah, setDefaultWilayah] = useState<HousingWilayah | null>(null)
  const [filterHousing, setFilterHousing] = useState(session.housing_complex_id ?? '')
  const [loadErr, setLoadErr] = useState<string | null>(null)

  function loadFamilies() {
    const housingParam = session.is_super_admin ? filterHousing || undefined : undefined
    void listResidents(housingParam)
      .then((data) => {
        setFamilies(data)
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(String(e)))
  }

  useEffect(() => {
    if (session.is_super_admin) {
      void listHousingComplexes()
        .then((list) =>
          setHousingOptions(
            list.map((h) => ({
              id: h.id,
              name: h.name,
              kecamatan: h.kecamatan ?? '',
              kelurahan: h.kelurahan ?? '',
              kode_pos: h.kode_pos ?? '',
            })),
          ),
        )
        .catch(() => setHousingOptions([]))
    } else {
      void getAdminMe()
        .then((me) => {
          if (me.housing_kecamatan && me.housing_kelurahan && me.housing_kode_pos) {
            setDefaultWilayah({
              kecamatan: me.housing_kecamatan,
              kelurahan: me.housing_kelurahan,
              kode_pos: me.housing_kode_pos,
            })
          }
        })
        .catch(() => setDefaultWilayah(null))
    }
    loadFamilies()
  }, [])

  useEffect(() => {
    if (session.is_super_admin) loadFamilies()
  }, [filterHousing])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" render={<Link to="/users" />}>
          <ArrowLeft className="mr-1 size-4" />
          Kembali ke daftar
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Tambah warga</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftarkan kepala keluarga baru atau anggota ke KK yang sudah ada.
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

      {session.is_super_admin ? (
        <label className="block max-w-md text-sm">
          Perumahan
          <select
            value={filterHousing}
            onChange={(e) => setFilterHousing(e.target.value)}
            className="mt-1 w-full rounded-md border px-2 py-1.5"
          >
            <option value="">— Pilih perumahan —</option>
            {housingOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted-foreground">
            Pilih perumahan agar daftar KK untuk anggota keluarga terisi.
          </span>
        </label>
      ) : null}

      <CreateResidentForm
        families={families}
        isSuperAdmin={session.is_super_admin}
        defaultHousingId={session.is_super_admin ? filterHousing || null : session.housing_complex_id}
        housingOptions={housingOptions}
        defaultWilayah={defaultWilayah}
        onCreated={() => navigate('/users')}
      />
    </div>
  )
}
