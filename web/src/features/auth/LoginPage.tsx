import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { bootstrapSessionFromApi } from '@/lib/sessionBootstrap'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'

export function LoginPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isApiConfigured()) {
      setError('VITE_API_BASE_URL belum diatur. Jalankan API di localhost:3000.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await login(identifier.trim(), password)
      setToken(res.access_token)
      await bootstrapSessionFromApi()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-beige px-6 py-10 text-royal">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-bold">Warga App</h1>
        <p className="mt-1 text-sm text-muted">Masuk dengan NIK atau No. HP</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              NIK / No. HP
            </span>
            <input
              className="mt-1.5 w-full rounded-xl border border-royal/20 bg-surface px-3 py-3 text-sm"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Password
            </span>
            <PasswordInput
              className="mt-1.5 w-full rounded-xl border border-royal/20 bg-surface px-3 py-3 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? (
            <p className="text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Memproses…' : 'Masuk'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Demo wali: NIK 3201010101010001 · sandi WargaDemo123!
        </p>
      </div>
    </main>
  )
}
