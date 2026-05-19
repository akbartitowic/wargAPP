import { ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listNewsCategories,
  uploadNewsHero,
  type NewsCategoryRow,
} from '@/api/admin'
import { getCmsSession } from '@/lib/cmsSession'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type NewsFormValues = {
  title: string
  slug: string
  excerpt: string
  body: string
  category_id: string
  is_priority: boolean
  image_url: string | null
  housing_complex_id?: string
}

type Props = {
  initial?: Partial<NewsFormValues>
  housingOptions?: { id: string; name: string }[]
  submitLabel: string
  onSubmit: (values: NewsFormValues) => Promise<void>
  onCancel: () => void
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 180)
}

export function NewsForm({
  initial,
  housingOptions,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const session = getCmsSession()
  const fileRef = useRef<HTMLInputElement>(null)
  const [housingId, setHousingId] = useState(
    initial?.housing_complex_id ?? session.housing_complex_id ?? housingOptions?.[0]?.id ?? '',
  )
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug))
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [isPriority, setIsPriority] = useState(initial?.is_priority ?? false)
  const [heroUrl, setHeroUrl] = useState<string | null>(initial?.image_url ?? null)
  const [preview, setPreview] = useState<string | null>(initial?.image_url ?? null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [categories, setCategories] = useState<NewsCategoryRow[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!session.is_super_admin || housingId || !housingOptions?.length) return
    setHousingId(housingOptions[0]!.id)
  }, [session.is_super_admin, housingId, housingOptions])

  useEffect(() => {
    const hid = session.is_super_admin ? housingId : session.housing_complex_id
    if (!hid) {
      setCategories([])
      setCategoriesLoading(false)
      return
    }
    let cancelled = false
    setCategoriesLoading(true)
    void listNewsCategories(hid)
      .then((rows) => {
        if (cancelled) return
        setCategories(rows)
        setCategoryId((prev) => {
          if (prev && rows.some((r) => r.id === prev)) return prev
          return rows[0]?.id ?? ''
        })
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [housingId, session.is_super_admin, session.housing_complex_id])

  useEffect(() => {
    if (!slugTouched && title) setSlug(slugify(title))
  }, [title, slugTouched])

  async function onImage(file: File | undefined) {
    if (!file) return
    setSelectedFileName(file.name)
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setMsg(null)
    try {
      const res = await uploadNewsHero(file)
      setHeroUrl(res.url)
      setMsg('Gambar hero diunggah.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Upload gagal')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!categoryId) {
      setMsg('Pilih kategori berita.')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        body: body.trim(),
        category_id: categoryId,
        is_priority: isPriority,
        image_url: heroUrl,
        ...(session.is_super_admin && housingId ? { housing_complex_id: housingId } : {}),
      })
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}

      {session.is_super_admin && housingOptions?.length ? (
        <label className="block text-sm">
          Perumahan
          <select
            value={housingId}
            onChange={(e) => setHousingId(e.target.value)}
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            required
          >
            {housingOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero 16:9</CardTitle>
          <CardDescription>Min. 640×360, otomatis di-crop di server.</CardDescription>
        </CardHeader>
        <div className="space-y-3 p-6 pt-0">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void onImage(e.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus data-icon="inline-start" />
              {uploading
                ? 'Mengunggah…'
                : preview
                  ? 'Ganti gambar'
                  : 'Pilih gambar hero'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedFileName ??
                (preview ? 'Gambar hero siap' : 'Belum ada file dipilih')}
            </span>
          </div>
          {preview ? (
            <img
              src={preview}
              alt="Pratinjau gambar hero"
              className="aspect-video w-full rounded-lg border object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground">
              Pratinjau gambar akan tampil di sini
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konten berita</CardTitle>
        </CardHeader>
        <div className="space-y-3 p-6 pt-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul"
            required
            className="w-full rounded-md border px-3 py-2"
          />
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            placeholder="slug-url"
            required
            className="w-full rounded-md border px-3 py-2 font-mono text-sm"
          />
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Ringkasan"
            required
            rows={2}
            className="w-full rounded-md border px-3 py-2"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Isi artikel (paragraf dipisah baris baru)"
            required
            rows={8}
            className="w-full rounded-md border px-3 py-2"
          />
          <label className="block text-sm">
            Kategori
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={categoriesLoading || categories.length === 0}
              className="mt-1 w-full rounded-md border px-2 py-1.5 disabled:opacity-60"
            >
              <option value="">
                {categoriesLoading
                  ? 'Memuat kategori…'
                  : categories.length === 0
                    ? '— Belum ada kategori —'
                    : '— Pilih kategori —'}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted-foreground">
              Kategori ini sama dengan filter di aplikasi warga.{' '}
              {!categoriesLoading && categories.length === 0 ? (
                <Link to="/news/categories" className="font-medium text-primary underline">
                  Kelola master kategori
                </Link>
              ) : null}
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPriority}
              onChange={(e) => setIsPriority(e.target.checked)}
            />
            Prioritas (hero banner di app)
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? 'Menyimpan…' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Batal
        </Button>
      </div>
    </form>
  )
}
