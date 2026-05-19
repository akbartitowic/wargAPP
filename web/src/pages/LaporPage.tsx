import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

export function LaporPage() {
  return (
    <div className="min-h-full bg-page-grey px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))] text-left">
      <header className="flex items-center gap-2 py-2">
        <Link
          to="/"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-royal transition hover:bg-royal/5"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <h1 className="text-xl font-bold text-royal">Lapor</h1>
      </header>
      <Card className="mt-4 border-royal/10">
        <p className="text-sm text-muted">
          Form laporan ke pengurus (IPL, fasum, keamanan) akan dihubungkan ke
          backend. Untuk demo, gunakan saluran resmi RW/RT Anda.
        </p>
      </Card>
    </div>
  )
}
