import { useEffect, useState } from 'react'
import type { AdminRole } from '@/api/admin'
import { ADMIN_ROLE_OPTIONS } from '@/lib/adminRoles'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type AdminFormValues = {
  email: string
  full_name: string
  password: string
  role: AdminRole
  housing_complex_id: string | null
  status: 'active' | 'inactive'
}

type HousingOption = { id: string; name: string }

type Props = {
  mode: 'create' | 'edit'
  housingOptions: HousingOption[]
  initial?: Partial<AdminFormValues> & { email?: string }
  saving?: boolean
  onSubmit: (values: AdminFormValues) => Promise<void>
  onCancel?: () => void
}

export function AdminForm({
  mode,
  housingOptions,
  initial,
  saving = false,
  onSubmit,
  onCancel,
}: Props) {
  const [email, setEmail] = useState(initial?.email ?? '')
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AdminRole>(initial?.role ?? 'housing_admin')
  const [housingId, setHousingId] = useState(initial?.housing_complex_id ?? '')
  const [status, setStatus] = useState<'active' | 'inactive'>(initial?.status ?? 'active')
  const [msg, setMsg] = useState<string | null>(null)

  const needsHousing = role !== 'super_admin'

  useEffect(() => {
    if (!needsHousing) setHousingId('')
  }, [needsHousing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (mode === 'create' && password.length < 8) {
      setMsg('Password minimal 8 karakter.')
      return
    }
    if (needsHousing && !housingId) {
      setMsg('Pilih perumahan untuk peran ini.')
      return
    }

    try {
      await onSubmit({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        password,
        role,
        housing_complex_id: needsHousing ? housingId : null,
        status,
      })
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menyimpan')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {mode === 'create' ? 'Data administrator baru' : 'Ubah administrator'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Akun dapat langsung login ke CMS dengan email dan password ini.'
            : 'Kosongkan password jika tidak ingin mengubahnya.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="grid gap-3 p-6 pt-0 md:grid-cols-2">
        {msg ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2"
            role="alert"
          >
            {msg}
          </p>
        ) : null}

        <label className="text-sm md:col-span-2">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={mode === 'edit'}
            className="mt-1 w-full rounded-md border px-2 py-1.5 read-only:bg-muted read-only:text-muted-foreground"
          />
        </label>
        <label className="text-sm md:col-span-2">
          Nama lengkap
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="mt-1 w-full rounded-md border px-2 py-1.5"
          />
        </label>
        <label className="text-sm md:col-span-2">
          {mode === 'create' ? 'Password' : 'Password baru (opsional)'}
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={mode === 'create'}
            minLength={mode === 'create' ? 8 : undefined}
            autoComplete={mode === 'create' ? 'new-password' : 'off'}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          Peran
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="mt-1 w-full rounded-md border px-2 py-1.5"
          >
            {ADMIN_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        {mode === 'edit' ? (
          <label className="text-sm">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
        ) : (
          <div className="hidden md:block" aria-hidden />
        )}
        {needsHousing ? (
          <label className="text-sm md:col-span-2">
            Perumahan
            <select
              value={housingId}
              onChange={(e) => setHousingId(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            >
              <option value="">— Pilih perumahan —</option>
              {housingOptions.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            {role === 'housing_admin' ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                Satu admin perumahan aktif per tenant.
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : mode === 'create' ? 'Simpan admin' : 'Simpan perubahan'}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Batal
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  )
}
