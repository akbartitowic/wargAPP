import { ArrowLeft, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFamilyMembers, type FamilyMemberRow } from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { Card } from '@/components/ui/Card'
import { resolveAvatarUrl } from '@/lib/avatar'
import { useSessionStore } from '@/store/sessionStore'

export function FamilyMembersPage() {
  const housing_name = useSessionStore((s) => s.housing_name)
  const [rows, setRows] = useState<FamilyMemberRow[]>([])
  const [loading, setLoading] = useState(isApiConfigured())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false)
      return
    }
    void fetchFamilyMembers()
      .then((data) => {
        setRows(data)
        setError(null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ProfileSubpageLayout title="Anggota keluarga" housingName={housing_name}>
      {loading ? (
        <p className="text-center text-sm text-muted">Memuat anggota keluarga…</p>
      ) : null}
      {error ? (
        <p className="text-center text-sm text-danger">{error}</p>
      ) : null}
      {!loading && !error ? (
        <ul className="flex flex-col gap-3">
          {rows.map((m) => (
            <li key={m.id}>
              <Card className="border-royal/10">
                <div className="flex items-center gap-3">
                  <img
                    src={resolveAvatarUrl(m.foto_profil_url, m.nama)}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                    width={48}
                    height={48}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-royal">
                      {m.nama}
                      {m.is_self ? (
                        <span className="ml-1.5 text-xs font-semibold text-muted">
                          (Anda)
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{m.role_label}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {m.blok_rumah} · {m.agama}
                    </p>
                  </div>
                  {m.is_parent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
                      <Check className="h-3 w-3" aria-hidden />
                      Wali
                    </span>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </ProfileSubpageLayout>
  )
}

export function ProfileSubpageLayout({
  title,
  housingName,
  children,
}: {
  title: string
  housingName: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full bg-page-grey pb-28 text-left">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-royal/10 bg-surface px-2 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-sm">
        <Link
          to="/profile"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-royal hover:bg-royal/5"
          aria-label="Kembali ke profil"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-royal">{title}</h1>
          {housingName ? (
            <p className="truncate text-xs text-muted">{housingName}</p>
          ) : null}
        </div>
      </header>
      <div className="px-4 py-5">{children}</div>
    </div>
  )
}
