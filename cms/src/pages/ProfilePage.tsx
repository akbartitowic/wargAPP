import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changeAdminPassword, getAdminMe, type AdminProfile } from '@/api/admin'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { clearCmsSession } from '@/lib/cmsSession'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super admin',
  housing_admin: 'Admin perumahan',
  finance_admin: 'Admin keuangan',
  content_admin: 'Admin konten',
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [msgOk, setMsgOk] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void getAdminMe()
      .then(setProfile)
      .catch((e) => setLoadErr(String(e)))
  }, [])

  useEffect(() => {
    if (window.location.hash === '#password') {
      document.getElementById('password')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [profile])

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setMsgOk(false)

    if (newPassword.length < 8) {
      setMsg('Password baru minimal 8 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setMsg('Konfirmasi password tidak cocok.')
      return
    }

    setSaving(true)
    try {
      await changeAdminPassword(currentPassword, newPassword)
      setMsg('Password berhasil diperbarui. Silakan login kembali.')
      setMsgOk(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        clearCmsSession()
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal mengubah password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil akun</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informasi login dan keamanan akun CMS Anda.
        </p>
      </div>

      {loadErr ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadErr}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi akun</CardTitle>
          <CardDescription>Data dari server (read-only).</CardDescription>
        </CardHeader>
        <dl className="grid gap-3 p-6 pt-0 text-sm">
          <div>
            <dt className="text-muted-foreground">Nama</dt>
            <dd className="font-medium">{profile?.full_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{profile?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Peran</dt>
            <dd className="font-medium">
              {profile ? (ROLE_LABELS[profile.role] ?? profile.role) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Perumahan</dt>
            <dd className="font-medium">
              {profile?.is_super_admin
                ? 'Semua perumahan (super admin)'
                : (profile?.housing_name ?? '—')}
            </dd>
          </div>
        </dl>
      </Card>

      <Card id="password">
        <CardHeader>
          <CardTitle className="text-base">Ganti password</CardTitle>
          <CardDescription>
            Setelah berhasil, Anda akan keluar dan diminta login dengan password baru.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onChangePassword} className="space-y-3 p-6 pt-0">
          {msg ? (
            <p
              className={`rounded-md border px-3 py-2 text-sm ${
                msgOk
                  ? 'border-green-200 bg-green-50 text-green-900'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}
              role="alert"
            >
              {msg}
            </p>
          ) : null}
          <label className="block text-sm">
            Password saat ini
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Password baru
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Konfirmasi password baru
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border px-2 py-1.5"
            />
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan password baru'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
