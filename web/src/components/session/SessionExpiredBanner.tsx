import { useEffect, useState } from 'react'
import { isSessionExpired, useSessionStore } from '@/store/sessionStore'

/** Banner jika token demo habis masa berlaku. */
export function SessionExpiredBanner() {
  const tokenExpiresAt = useSessionStore((s) => s.token_expires_at)
  const renewSessionExpiry = useSessionStore((s) => s.renewSessionExpiry)
  const [expired, setExpired] = useState(() => isSessionExpired())

  useEffect(() => {
    const tick = () => setExpired(isSessionExpired())
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [tokenExpiresAt])

  if (!expired) return null

  return (
    <div
      role="alert"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950"
    >
      <p className="font-semibold">Sesi Anda sudah berakhir (token).</p>
      <button
        type="button"
        className="mt-1 font-semibold text-royal underline-offset-2 hover:underline"
        onClick={() => {
          renewSessionExpiry()
          setExpired(false)
        }}
      >
        Perpanjang sesi demo
      </button>
    </div>
  )
}
