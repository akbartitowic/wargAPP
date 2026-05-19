import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  getAdminAccount,
  listHousingComplexes,
  updateAdminAccount,
} from '@/api/admin'
import { AdminForm, type AdminFormValues } from '@/components/admins/AdminForm'
import { Button } from '@/components/ui/button'

export function EditAdminPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [initial, setInitial] = useState<Partial<AdminFormValues> & { email: string } | null>(
    null,
  )

  useEffect(() => {
    void listHousingComplexes()
      .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
      .catch(() => setHousingOptions([]))
  }, [])

  useEffect(() => {
    if (!id) return
    void getAdminAccount(id)
      .then((row) => {
        setInitial({
          email: row.email,
          full_name: row.full_name,
          role: row.role,
          housing_complex_id: row.housing_complex_id,
          status: row.status,
          password: '',
        })
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [id])

  async function onSubmit(values: AdminFormValues) {
    if (!id) return
    setSaving(true)
    try {
      await updateAdminAccount(id, {
        full_name: values.full_name,
        role: values.role,
        housing_complex_id: values.housing_complex_id,
        status: values.status,
        ...(values.password ? { password: values.password } : {}),
      })
      navigate('/admins')
    } finally {
      setSaving(false)
    }
  }

  if (!id) {
    return <p className="text-sm text-destructive">ID admin tidak valid.</p>
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
        <h1 className="text-2xl font-semibold">Edit administrator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui peran, perumahan, atau status akun. Email tidak dapat diubah.
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
        <AdminForm
          mode="edit"
          housingOptions={housingOptions}
          initial={initial}
          saving={saving}
          onSubmit={onSubmit}
          onCancel={() => navigate('/admins')}
        />
      ) : loadErr ? null : (
        <p className="text-sm text-muted-foreground">Memuat data…</p>
      )}
    </div>
  )
}
