import { Camera, ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isApiConfigured } from '@/config/api/client'
import { updateProfile, uploadProfilePhoto } from '@/config/api/endpoints'
import { WargaAppTopBar } from '@/components/layout/WargaAppTopBar'
import { resolveAvatarUrl } from '@/lib/avatar'
import { refreshProfileInSession } from '@/lib/sessionBootstrap'
import { useSessionStore } from '@/store/sessionStore'

const MAX_BYTES = 2 * 1024 * 1024
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function validatePhotoFile(file: File): string | null {
  if (!ACCEPT_TYPES.includes(file.type)) {
    return 'Format harus JPG, PNG, atau WebP.'
  }
  if (file.size > MAX_BYTES) {
    return 'Ukuran file maksimal 2MB.'
  }
  return null
}

export function EditProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)
  const full_name = useSessionStore((s) => s.full_name)
  const no_hp = useSessionStore((s) => s.no_hp)
  const foto_profil_url = useSessionStore((s) => s.foto_profil_url)
  const setFromServer = useSessionStore((s) => s.setFromServer)

  const [phone, setPhone] = useState(no_hp)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
      }
    }
  }, [])

  const avatarSrc =
    localPreview ?? resolveAvatarUrl(foto_profil_url, full_name)

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !isApiConfigured()) return

    const validationError = validatePhotoFile(file)
    if (validationError) {
      setMsg(validationError)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
    }
    const blobUrl = URL.createObjectURL(file)
    previewRef.current = blobUrl
    setLocalPreview(blobUrl)

    setMsg(null)
    setUploading(true)
    try {
      const profile = await uploadProfilePhoto(file)
      setFromServer({
        foto_profil_url: profile.foto_profil_url,
        full_name: profile.nama,
        no_hp: profile.no_hp,
      })
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
      }
      setLocalPreview(null)
      setMsg('Foto profil berhasil diperbarui.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload gagal')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onSavePhone(e: React.FormEvent) {
    e.preventDefault()
    if (!isApiConfigured()) return
    const normalized = phone.replace(/\s/g, '')
    if (!/^08\d{8,11}$/.test(normalized)) {
      setMsg('No. HP tidak valid (format 08xxxxxxxxxx).')
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      await updateProfile({ no_hp: normalized })
      await refreshProfileInSession()
      setMsg('Profil berhasil disimpan.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-page-grey pb-28">
      <header className="bg-royal pt-[max(0.5rem,env(safe-area-inset-top))]">
        <WargaAppTopBar />
      </header>

      <div className="px-4 py-4">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-sm font-semibold text-royal"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Kembali
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-royal">Ubah profil</h1>
        <p className="mt-1 text-sm text-muted">
          Foto dan No. HP akan tampil di CMS admin untuk warga yang sama.
        </p>

        <div className="mt-8 flex flex-col items-center">
          <div className="relative">
            <img
              key={avatarSrc}
              src={avatarSrc}
              alt=""
              className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
              width={112}
              height={112}
            />
            <button
              type="button"
              disabled={uploading || !isApiConfigured()}
              className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-royal text-white shadow-md disabled:opacity-60"
              onClick={() => fileRef.current?.click()}
              aria-label="Ganti foto profil"
            >
              <Camera className="h-5 w-5" aria-hidden />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_TYPES.join(',')}
              className="sr-only"
              onChange={(e) => void onPickPhoto(e)}
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            {uploading
              ? 'Mengunggah foto…'
              : 'Ketuk ikon kamera · JPG/PNG/WebP, maks. 2MB, min. 200×200 px'}
          </p>
        </div>

        <form onSubmit={onSavePhone} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-royal">
            No. HP (login & kontak)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              required
              className="mt-1.5 w-full rounded-xl border border-royal/15 bg-surface px-3 py-3 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={saving || uploading || !isApiConfigured()}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-royal text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Menyimpan…' : 'Simpan perubahan'}
          </button>
        </form>

        {msg ? (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              msg.includes('berhasil')
                ? 'bg-success-soft text-success'
                : 'bg-surface text-royal'
            }`}
            role="status"
          >
            {msg}
          </p>
        ) : null}

        {!isApiConfigured() ? (
          <p className="mt-4 text-sm text-danger">
            API belum dikonfigurasi. Set VITE_API_BASE_URL di environment.
          </p>
        ) : null}
      </div>
    </div>
  )
}
