import { useState } from 'react'
import {
  resetResidentPassword,
  setResidentAccountStatus,
  type ResidentDetail,
} from '@/api/admin'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const WARGA_APP_URL =
  import.meta.env.VITE_WARGA_APP_URL?.trim() || 'http://localhost:5173'

type Props = {
  resident: ResidentDetail
  onUpdated: (resident: ResidentDetail) => void
}

export function ResidentAccountForm({ resident, onUpdated }: Props) {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [savingPwd, setSavingPwd] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)

  const isActive = resident.status === 'active'

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (password.length < 8) {
      setMsg('Password baru minimal 8 karakter.')
      return
    }
    setSavingPwd(true)
    try {
      const updated = await resetResidentPassword(resident.id, password)
      setPassword('')
      onUpdated(updated)
      setMsg('Password berhasil diatur ulang.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal mengatur ulang password')
    } finally {
      setSavingPwd(false)
    }
  }

  async function onToggleStatus() {
    const next = isActive ? 'inactive' : 'active'
    const label = next === 'inactive' ? 'menonaktifkan' : 'mengaktifkan'
    if (!window.confirm(`Yakin ingin ${label} akun login ${resident.nama}?`)) return

    setMsg(null)
    setTogglingStatus(true)
    try {
      const updated = await setResidentAccountStatus(resident.id, next)
      onUpdated(updated)
      setMsg(
        next === 'active'
          ? 'Akun diaktifkan. Warga dapat login di aplikasi.'
          : 'Akun dinonaktifkan. Login diblokir.',
      )
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal mengubah status akun')
    } finally {
      setTogglingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cara login di Warga App</CardTitle>
          <CardDescription>
            Warga masuk dengan <strong>NIK (16 digit)</strong> atau <strong>No. HP</strong> beserta
            password yang Anda atur di bawah.
          </CardDescription>
        </CardHeader>
        <div className="space-y-3 px-6 pb-6 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Status akun:</span>
            {isActive ? (
              <Badge className="bg-emerald-600/90 hover:bg-emerald-600/90">Aktif</Badge>
            ) : (
              <Badge variant="secondary">Nonaktif</Badge>
            )}
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">NIK (login)</dt>
              <dd className="font-mono text-xs">{resident.nik_masked}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">No. HP (login)</dt>
              <dd className="font-mono text-xs">{resident.no_hp}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground">
            URL aplikasi warga:{' '}
            <a
              href={WARGA_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {WARGA_APP_URL}
            </a>
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atur ulang password</CardTitle>
          <CardDescription>
            Password baru langsung berlaku untuk login. Bagikan ke warga melalui saluran aman.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onResetPassword} className="space-y-4 px-6 pb-6">
          <label className="block text-sm">
            Password baru
            <PasswordInput
              className="mt-1 w-full max-w-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <Button type="submit" disabled={savingPwd}>
            {savingPwd ? 'Menyimpan…' : 'Simpan password'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status akun login</CardTitle>
          <CardDescription>
            Nonaktifkan jika warga pindah atau tidak boleh mengakses aplikasi. Kepala keluarga
            (wali) tidak bisa dinonaktifkan sebelum diganti.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <Button
            type="button"
            variant={isActive ? 'destructive' : 'default'}
            disabled={togglingStatus}
            onClick={() => void onToggleStatus()}
          >
            {togglingStatus
              ? 'Memproses…'
              : isActive
                ? 'Nonaktifkan akun login'
                : 'Aktifkan kembali akun login'}
          </Button>
        </div>
      </Card>

      {msg ? (
        <p
          className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
          role="status"
        >
          {msg}
        </p>
      ) : null}
    </div>
  )
}
