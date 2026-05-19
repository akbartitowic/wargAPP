import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '@/api/admin'
import { setCmsSession } from '@/lib/cmsSession'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'

export function CmsLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@warga.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await adminLogin(email, password)
      setCmsSession({
        access_token: res.access_token,
        role: res.role,
        housing_complex_id: res.housing_complex_id,
        housing_name: res.housing_name,
        is_super_admin: res.is_super_admin,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">CMS Warga App</h1>
          <p className="text-sm text-muted-foreground">Masuk sebagai administrator</p>
        </div>
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input
            type="email"
            className="w-full rounded-md border bg-background px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <PasswordInput
            className="w-full rounded-md border bg-background px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Memproses…' : 'Masuk'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Super admin: admin@warga.local · Admin perumahan: rt@perumahan-demo.local
          <br />
          Password: AdminDemo123!
        </p>
      </form>
    </main>
  )
}
