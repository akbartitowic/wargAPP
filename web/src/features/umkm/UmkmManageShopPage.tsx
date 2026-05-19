import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Pencil,
  Plus,
  Store,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { LazyImage } from '@/components/ui/LazyImage'
import {
  fetchMyPartnerShop,
  fetchPartnerManageDashboard,
  setPartnerOpenStatus,
  submitPartnerProductCreate,
  submitPartnerProductDelete,
  submitPartnerProductUpdate,
  submitPartnerShopUpdate,
  uploadPartnerShopImage,
  type PartnerManageDashboard,
  type PartnerManageProduct,
} from '@/config/api/endpoints'
import { isApiConfigured } from '@/config/api/client'
import { formatIDR } from '@/lib/format'
import { resolveMediaUrl } from '@/lib/mediaUrl'

const CATEGORIES = ['Makanan', 'Jasa', 'Kebutuhan'] as const

export function UmkmManageShopPage() {
  const [loading, setLoading] = useState(true)
  const [shopStatus, setShopStatus] = useState<
    'pending' | 'approved' | 'rejected' | 'inactive' | null
  >(null)
  const [data, setData] = useState<PartnerManageDashboard | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgOk, setMsgOk] = useState(false)

  const shopFileRef = useRef<HTMLInputElement>(null)
  const productFileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Makanan')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('20:00')
  const [shopImageUrl, setShopImageUrl] = useState('')
  const [shopPreview, setShopPreview] = useState<string | null>(null)

  const [editingProduct, setEditingProduct] = useState<PartnerManageProduct | null>(null)
  const [productName, setProductName] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productImageUrl, setProductImageUrl] = useState('')
  const [productPreview, setProductPreview] = useState<string | null>(null)
  const [showProductForm, setShowProductForm] = useState(false)

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const my = await fetchMyPartnerShop()
      if (!my) {
        setShopStatus(null)
        setData(null)
        return
      }
      setShopStatus(my.status)
      if (my.status !== 'approved') {
        setData(null)
        return
      }
      const dash = await fetchPartnerManageDashboard()
      setData(dash)
      setName(dash.shop.name)
      setCategory(dash.shop.category as (typeof CATEGORIES)[number])
      setTagline(dash.shop.tagline ?? '')
      setDescription(dash.shop.description ?? '')
      setWhatsapp(dash.shop.whatsapp ?? '')
      setOpenTime(dash.shop.open_time)
      setCloseTime(dash.shop.close_time)
      if (dash.shop.image_url) {
        setShopImageUrl(dash.shop.image_url)
        setShopPreview(resolveMediaUrl(dash.shop.image_url))
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal memuat data toko')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function flash(message: string, ok = true) {
    setMsg(message)
    setMsgOk(ok)
  }

  async function onToggleOpen() {
    if (!data) return
    try {
      await setPartnerOpenStatus(!data.shop.is_manual_closed)
      flash(
        !data.shop.is_manual_closed
          ? 'Toko ditandai tutup sementara.'
          : 'Toko dibuka kembali (sesuai jam operasional).',
      )
      await load()
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Gagal mengubah status', false)
    }
  }

  async function onShopImage(file: File | undefined) {
    if (!file) return
    setShopPreview(URL.createObjectURL(file))
    try {
      const { url } = await uploadPartnerShopImage(file, 'shop')
      setShopImageUrl(url)
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Gagal upload foto toko', false)
    }
  }

  async function onProductImage(file: File | undefined) {
    if (!file) return
    setProductPreview(URL.createObjectURL(file))
    try {
      const { url } = await uploadPartnerShopImage(file, 'product')
      setProductImageUrl(url)
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Gagal upload foto produk', false)
    }
  }

  async function onSubmitShop(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await submitPartnerShopUpdate({
        name: name.trim(),
        category,
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        image_url: shopImageUrl || null,
        open_time: openTime,
        close_time: closeTime,
        whatsapp: whatsapp.trim() || null,
      })
      flash(res.message)
      await load()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Gagal mengajukan perubahan', false)
    }
  }

  function resetProductForm() {
    setEditingProduct(null)
    setProductName('')
    setProductDesc('')
    setProductPrice('')
    setProductImageUrl('')
    setProductPreview(null)
    setShowProductForm(false)
  }

  function startEditProduct(p: PartnerManageProduct) {
    setEditingProduct(p)
    setProductName(p.name)
    setProductDesc(p.description ?? '')
    setProductPrice(String(p.price))
    setProductImageUrl(p.image_url ?? '')
    setProductPreview(p.image_url ? resolveMediaUrl(p.image_url) : null)
    setShowProductForm(true)
  }

  async function onSubmitProduct(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(productPrice)
    if (!productName.trim() || Number.isNaN(price) || price < 0) {
      flash('Nama dan harga produk wajib diisi dengan benar.', false)
      return
    }
    try {
      const body = {
        name: productName.trim(),
        description: productDesc.trim() || null,
        price,
        image_url: productImageUrl || null,
      }
      const res = editingProduct
        ? await submitPartnerProductUpdate(editingProduct.id, body)
        : await submitPartnerProductCreate(body)
      flash(res.message)
      resetProductForm()
      await load()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Gagal mengajukan produk', false)
    }
  }

  async function onDeleteProduct(p: PartnerManageProduct) {
    if (!confirm(`Ajukan penghapusan "${p.name}"? Perlu persetujuan pengurus.`)) return
    try {
      const res = await submitPartnerProductDelete(p.id)
      flash(res.message)
      await load()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Gagal mengajukan penghapusan', false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-page-grey px-4 py-12 text-center text-sm text-muted">
        Memuat…
      </div>
    )
  }

  if (shopStatus === 'pending') {
    return (
      <div className="min-h-full bg-page-grey pb-28">
        <ManageHeader />
        <div className="px-4 pt-5">
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Pengajuan toko Anda masih menunggu persetujuan pengurus. Setelah disetujui, Anda bisa
            mengelola toko di halaman ini.
          </p>
          <ButtonLink to="/umkm" variant="secondary" className="mt-4 w-full justify-center">
            Kembali
          </ButtonLink>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-full bg-page-grey pb-28">
        <ManageHeader />
        <div className="px-4 pt-5 text-center text-sm text-muted">
          {msg ?? 'Belum ada toko mitra. Daftar mitra terlebih dahulu.'}
          <ButtonLink to="/umkm/daftar-mitra" className="mt-4 w-full justify-center">
            Daftar mitra
          </ButtonLink>
        </div>
      </div>
    )
  }

  const { shop, products, pending_requests } = data

  return (
    <div className="min-h-full bg-page-grey pb-28">
      <ManageHeader />
      <div className="space-y-6 px-4 pt-5">
        {msg ? (
          <p
            className={`rounded-xl px-3 py-2 text-sm ${msgOk ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}
            role="alert"
          >
            {msg}
          </p>
        ) : null}

        <section className="rounded-2xl border border-royal/10 bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Status toko</p>
              <p className="mt-1 text-lg font-bold text-royal">{shop.open_status_label}</p>
              <p className="text-xs text-muted">
                Jam: {shop.open_time} – {shop.close_time}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onToggleOpen()}
              className={
                shop.is_manual_closed
                  ? 'rounded-full bg-success px-4 py-2 text-sm font-semibold text-white'
                  : 'rounded-full bg-royal/10 px-4 py-2 text-sm font-semibold text-royal'
              }
            >
              {shop.is_manual_closed ? 'Buka toko' : 'Tutup sementara'}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">
            Tutup/buka sementara langsung aktif. Ubah jam operasional lewat formulir profil (perlu
            persetujuan CMS).
          </p>
          <ButtonLink
            to={`/umkm/${shop.id}`}
            variant="secondary"
            className="mt-4 w-full justify-center gap-2"
          >
            <ExternalLink className="size-4" aria-hidden />
            Lihat halaman toko
          </ButtonLink>
        </section>

        {pending_requests.length > 0 ? (
          <section className="rounded-2xl border border-amber-200/60 bg-amber-50/80 p-4">
            <p className="text-sm font-semibold text-amber-950">Menunggu persetujuan CMS</p>
            <ul className="mt-2 space-y-1.5 text-xs text-amber-900">
              {pending_requests.map((r) => (
                <li key={r.id}>• {r.summary}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl border border-royal/10 bg-surface p-4 shadow-sm">
          <h2 className="text-base font-bold text-royal">Profil toko</h2>
          <p className="mt-1 text-xs text-muted">
            Perubahan dikirim ke pengurus — akan tampil setelah disetujui.
          </p>
          <form onSubmit={(e) => void onSubmitShop(e)} className="mt-4 space-y-3">
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              {shopPreview ? (
                <LazyImage src={shopPreview} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-muted">
                  Foto toko
                </div>
              )}
            </div>
            <input
              ref={shopFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onShopImage(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => shopFileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-royal/15 py-2.5 text-sm font-medium text-royal"
            >
              <ImagePlus className="size-4" />
              Ganti foto toko
            </button>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nama toko"
              className="w-full rounded-xl border border-royal/12 px-3 py-2.5 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
              className="w-full rounded-xl border border-royal/12 px-3 py-2.5 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Tagline"
              className="w-full rounded-xl border border-royal/12 px-3 py-2.5 text-sm"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi toko"
              className="w-full rounded-xl border border-royal/12 px-3 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
                className="rounded-xl border border-royal/12 px-2 py-2.5 text-sm"
              />
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
                className="rounded-xl border border-royal/12 px-2 py-2.5 text-sm"
              />
            </div>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="WhatsApp pesanan"
              className="w-full rounded-xl border border-royal/12 px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-royal py-3 text-sm font-semibold text-white"
            >
              Ajukan perubahan profil
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-royal/10 bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-royal">Menu / produk</h2>
            <button
              type="button"
              onClick={() => {
                resetProductForm()
                setShowProductForm(true)
              }}
              className="flex items-center gap-1 rounded-lg bg-royal/10 px-2.5 py-1.5 text-xs font-semibold text-royal"
            >
              <Plus className="size-3.5" />
              Tambah
            </button>
          </div>

          {showProductForm ? (
            <form onSubmit={(e) => void onSubmitProduct(e)} className="mt-4 space-y-3 border-t border-royal/10 pt-4">
              <p className="text-sm font-semibold text-royal">
                {editingProduct ? 'Edit produk' : 'Produk baru'}
              </p>
              <div className="aspect-square max-w-[140px] overflow-hidden rounded-xl bg-muted">
                {productPreview ? (
                  <LazyImage src={productPreview} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <input
                ref={productFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onProductImage(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => productFileRef.current?.click()}
                className="text-sm font-medium text-royal"
              >
                + Foto produk
              </button>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                placeholder="Nama produk"
                className="w-full rounded-xl border border-royal/12 px-3 py-2.5 text-sm"
              />
              <textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                rows={2}
                placeholder="Deskripsi"
                className="w-full rounded-xl border border-royal/12 px-3 py-2.5 text-sm"
              />
              <input
                type="number"
                min={0}
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                required
                placeholder="Harga (Rp)"
                className="w-full rounded-xl border border-royal/12 px-3 py-2.5 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-royal py-2.5 text-sm font-semibold text-white"
                >
                  Ajukan ke CMS
                </button>
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="rounded-xl border border-royal/15 px-4 py-2.5 text-sm text-royal"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : null}

          <ul className="mt-4 space-y-3">
            {products.filter((p) => p.is_active).map((p) => (
              <li
                key={p.id}
                className="flex gap-3 rounded-xl border border-royal/10 p-3"
              >
                <LazyImage
                  src={resolveMediaUrl(p.image_url)}
                  alt=""
                  className="size-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-royal">{p.name}</p>
                  <p className="text-sm font-bold text-royal">{formatIDR(p.price)}</p>
                  {p.has_pending_change ? (
                    <p className="text-[11px] text-amber-700">Perubahan menunggu CMS</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => startEditProduct(p)}
                    className="rounded-lg p-2 text-royal hover:bg-royal/5"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Hapus"
                    onClick={() => void onDeleteProduct(p)}
                    className="rounded-lg p-2 text-danger hover:bg-danger-soft"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {products.filter((p) => p.is_active).length === 0 ? (
            <p className="mt-4 text-center text-sm text-muted">Belum ada produk aktif.</p>
          ) : null}
        </section>
      </div>
    </div>
  )
}

function ManageHeader() {
  return (
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
        Kelola toko Anda
      </h1>
      <p className="mt-1 text-sm text-white/85">
        Status buka/tutup langsung. Ubah profil & menu perlu persetujuan pengurus.
      </p>
    </header>
  )
}
