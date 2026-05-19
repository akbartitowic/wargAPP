import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { createHousingComplex } from '@/api/admin'
import { HousingForm, type HousingFormValues } from '@/components/housing/HousingForm'
import { Button } from '@/components/ui/button'

export function CreateHousingPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  async function onSubmit(values: HousingFormValues) {
    setSaving(true)
    try {
      await createHousingComplex({
        name: values.name,
        slug: values.slug,
        address: values.address,
        kelurahan_kode: values.kelurahan_kode,
      })
      navigate('/housing')
    } finally {
      setSaving(false)
    }
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
        <h1 className="text-2xl font-semibold">Tambah perumahan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftarkan tenant perumahan baru. Menu home default dibuat otomatis.
        </p>
      </div>

      <HousingForm
        mode="create"
        title="Data perumahan"
        description="Wilayah dari Kemendagri — pilih provinsi hingga kelurahan; kode pos terisi otomatis."
        saving={saving}
        onSubmit={onSubmit}
        onCancel={() => navigate('/housing')}
      />
    </div>
  )
}
