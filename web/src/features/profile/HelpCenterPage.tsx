import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSupportInfo, type SupportInfoResponse } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { Card } from '@/components/ui/Card'
import { useSessionStore } from '@/store/sessionStore'
import { ProfileSubpageLayout } from '@/features/profile/FamilyMembersPage'

export function HelpCenterPage() {
  const housing_name = useSessionStore((s) => s.housing_name)
  const [info, setInfo] = useState<SupportInfoResponse | null>(null)
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false)
      return
    }
    void fetchSupportInfo()
      .then(setInfo)
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ProfileSubpageLayout title="Pusat bantuan" housingName={housing_name || info?.housing_name || ''}>
      {loading ? (
        <p className="text-center text-sm text-muted">Memuat…</p>
      ) : null}
      {error ? (
        <p className="text-center text-sm text-danger">{error}</p>
      ) : null}
      {info ? (
        <div className="space-y-5">
          <Card className="border-royal/10">
            <h2 className="text-sm font-bold text-royal">{info.housing_name}</h2>
            {info.housing_address ? (
              <p className="mt-2 text-sm text-muted">{info.housing_address}</p>
            ) : null}
            {info.wilayah ? (
              <p className="mt-1 text-xs text-muted">{info.wilayah}</p>
            ) : null}
          </Card>

          <section>
            <h2 className="text-sm font-bold text-royal">Layanan cepat</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {info.channels.map((ch) => (
                <li key={ch.key}>
                  <Link
                    to={ch.route}
                    className="flex items-center gap-3 rounded-xl border border-royal/10 bg-surface px-4 py-3.5 shadow-sm transition hover:border-royal/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-royal">{ch.label}</p>
                      <p className="mt-0.5 text-xs text-muted">{ch.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-royal/35" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-royal">Pertanyaan umum</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {info.faq.map((item) => (
                <li key={item.q}>
                  <Card className="border-royal/10">
                    <p className="text-sm font-semibold text-royal">{item.q}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </ProfileSubpageLayout>
  )
}
