import { Bell } from 'lucide-react'
import { resolveAvatarUrl } from '@/lib/avatar'
import { useSessionStore } from '@/store/sessionStore'

/** Bar atas biru: avatar kecil, judul app, lonceng (dipakai Profil & UMKM). */
export function WargaAppTopBar() {
  const fullName = useSessionStore((s) => s.full_name)
  const foto_profil_url = useSessionStore((s) => s.foto_profil_url)

  return (
    <div className="relative grid grid-cols-3 items-center gap-2 px-4 pb-3 pt-2">
      <img
        src={resolveAvatarUrl(foto_profil_url, fullName)}
        alt=""
        className="h-9 w-9 shrink-0 justify-self-start rounded-full border-2 border-white/30 bg-white/10 object-cover"
        width={36}
        height={36}
      />
      <h1 className="justify-self-center text-base font-bold tracking-tight text-white">
        Warga App
      </h1>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center justify-self-end rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}
