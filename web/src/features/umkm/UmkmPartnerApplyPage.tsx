import { ArrowLeft, ExternalLink, ImagePlus, Store } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { LazyImage } from '@/components/ui/LazyImage'
import {
  applyPartnerShop,
  fetchMyPartnerShop,
  uploadPartnerShopImage,
  type PartnerShopResponse,
} from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { resolveMediaUrl } from '@/lib/mediaUrl'

const CATEGORIES = ['Makanan', 'Jasa', 'Kebutuhan'] as const

export function UmkmPartnerApplyPage() {
  const location = useLocation()
  const isManageRoute = location.pathname.endsWith('/kelola-toko')
  const fileRef = useRef<HTMLInputElement>(null)
  const [existing, setExisting] = useState<PartnerShopResponse | null | undefined>(undefined)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Makanan')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('20:00')
  const [imageUrl, setImageUrl] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgOk, setMsgOk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isApiConfigured()) {
      setExisting(null)
      return
    }
    void fetchMyPartnerShop()
      .then((shop) => {
        setExisting(shop)
        if (shop) {
          setName(shop.name)
          setCategory(shop.category as (typeof CATEGORIES)[number])
          setTagline(shop.tagline ?? '')
          setDescription(shop.description ?? '')
          setWhatsapp(shop.whatsapp ?? '')
          setOpenTime(shop.open_time)
          setCloseTime(shop.close_time)
          if (shop.image_url) {
            setImageUrl(shop.image_url)
            setPreview(resolveMediaUrl(shop.image_url))
          }
        }
      })
      .catch(() => setExisting(null))
  }, [])

  async function onImage(file: File | undefined) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const { url } = await uploadPartnerShopImage(file)
      setImageUrl(url)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal upload foto')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isApiConfigured()) {
      setMsg('Hubungkan aplikasi ke API untuk mengajukan mitra.')
      return
    }
    if (existing?.status === 'approved') {
      setMsg('Toko Anda sudah aktif.')
      return
    }
    if (existing?.status === 'pending') {
      setMsg('Pengajuan masih menunggu persetujuan.')
      return
    }

    setSaving(true)
    setMsg(null)
    setMsgOk(false)
    try {
      const shop = await applyPartnerShop({
        name: name.trim(),
        category,
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        image_url: imageUrl || null,
        open_time: openTime,
        close_time: closeTime,
        whatsapp: whatsapp.trim() || null,
      })
      setExisting(shop)
      setMsgOk(true)
      setMsg('Pengajuan berhasil dikirim. Tim perumahan akan meninjau toko Anda.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal mengajukan')
    } finally {
      setSaving(false)
    }
  }

  const showForm = !existing || existing.status === 'rejected'
  const isExistingPartner =
    existing != null && existing.status !== 'rejected'
  const pageTitle =
    isManageRoute || isExistingPartner ? 'Kelola toko Anda' : 'Daftar menjadi mitra'
  const pageSubtitle = isExistingPartner
    ? existing.status === 'approved'
      ? 'Lihat status toko dan tampilan halaman toko di daftar UMKM.'
      : 'Pantau status pengajuan toko Anda ke pengurus perumahan.'
    : 'Ajukan toko UMKM Anda. Setelah disetujui, toko tampil di daftar warga.'

  return (
    <div className="min-h-full bg-page-grey pb-28">
      <header className="bg-royal px-4 pb-5 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <Link
          to="/umkm"
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
          aria-label="Kembali"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Store className="size-6" />
          {pageTitle}
        </h1>
        <p className="mt-1 text-sm text-white/85">{pageSubtitle}</p>
      </header>

      <div className="px-4 pt-5">
        {existing && existing.status !== 'rejected' ? (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              existing.status === 'approved'
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <p className="font-semibold">{existing.status_label}</p>
            <p className="mt-1 text-xs opacity-90">Toko: {existing.name}</p>
          </div>
        ) : null}

        {msg ? (
          <p
            className={`mb-4 rounded-xl px-3 py-2 text-sm ${
              msgOk ? 'bg-green-50 text-green-900' : 'bg-danger-soft text-danger'
            }`}
            role="alert"
          >
            {msg}
          </p>
        ) : null}

        {showForm ? (
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-royal/10 bg-surface p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-royal">Foto toko</p>
              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                {preview ? (
                  <LazyImage src={preview} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-sm text-muted">
                    Unggah foto cover toko
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onImage(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-royal/15 py-2.5 text-sm font-medium text-royal"
              >
                <ImagePlus className="size-4" />
                {uploading ? 'Mengunggah…' : 'Pilih foto'}
              </button>
            </div>

            <label className="block text-sm">
              <span className="font-medium text-royal">Nama toko *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-royal/12 px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-royal">Kategori jualan *</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
                className="mt-1 w-full rounded-xl border border-royal/12 px-3 py-2.5"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-royal">Tagline</span>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Slogan singkat toko"
                className="mt-1 w-full rounded-xl border border-royal/12 px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-royal">Detail toko</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ceritakan produk/layanan Anda…"
                className="mt-1 w-full rounded-xl border border-royal/12 px-3 py-2.5"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium text-royal">Buka</span>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-royal/12 px-2 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-royal">Tutup</span>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-royal/12 px-2 py-2.5"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-royal">WhatsApp pesanan</span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="mt-1 w-full rounded-xl border border-royal/12 px-3 py-2.5"
              />
            </label>

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-xl bg-royal py-3.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {saving ? 'Mengirim…' : existing?.status === 'rejected' ? 'Ajukan ulang' : 'Kirim pengajuan'}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {existing?.status === 'approved' ? (
              <ButtonLink
                to={`/umkm/${existing.id}`}
                variant="primary"
                className="w-full justify-center gap-2"
              >
                <ExternalLink className="size-4" aria-hidden />
                Lihat halaman toko
              </ButtonLink>
            ) : null}
            <ButtonLink to="/umkm" variant="secondary" className="w-full justify-center">
              Kembali ke daftar UMKM
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  )
}
