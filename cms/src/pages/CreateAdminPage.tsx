import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { createAdminAccount, listHousingComplexes } from '@/api/admin'
import { AdminForm, type AdminFormValues } from '@/components/admins/AdminForm'
import { Button } from '@/components/ui/button'

export function CreateAdminPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    void listHousingComplexes()
      .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
      .catch(() => setHousingOptions([]))
  }, [])

  async function onSubmit(values: AdminFormValues) {
    setSaving(true)
    try {
      await createAdminAccount({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        role: values.role,
        housing_complex_id: values.housing_complex_id,
      })
      navigate('/admins')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" render={<Link to="/admins" />}>
          <ArrowLeft className="mr-1 size-4" />
          Kembali ke daftar
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Tambah administrator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat akun baru untuk mengelola perumahan, tagihan, atau konten.
        </p>
      </div>

      <AdminForm
        mode="create"
        housingOptions={housingOptions}
        saving={saving}
        onSubmit={onSubmit}
        onCancel={() => navigate('/admins')}
      />
    </div>
  )
}
