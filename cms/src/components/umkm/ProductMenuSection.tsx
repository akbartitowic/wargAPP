import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createUmkmProduct,
  deleteUmkmProduct,
  listUmkmProducts,
  updateUmkmProduct,
  uploadUmkmImage,
  type UmkmProductRow,
} from '@/api/umkm'
import { formatIdr } from '@/lib/billingFormat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = { shopId: string }

type Draft = {
  name: string
  description: string
  price: string
  image_url: string
  is_active: boolean
  sort_order: string
}

const emptyDraft = (): Draft => ({
  name: '',
  description: '',
  price: '',
  image_url: '',
  is_active: true,
  sort_order: '0',
})

export function ProductMenuSection({ shopId }: Props) {
  const [products, setProducts] = useState<UmkmProductRow[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(() => {
    void listUmkmProducts(shopId)
      .then((rows) => {
        setProducts(rows)
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat menu'))
  }, [shopId])

  useEffect(() => {
    reload()
  }, [reload])

  function openCreate() {
    setEditingId(null)
    setDraft(emptyDraft())
    setPreview(null)
    setShowForm(true)
  }

  function openEdit(p: UmkmProductRow) {
    setEditingId(p.id)
    setDraft({
      name: p.name,
      description: p.description ?? '',
      price: String(p.price),
      image_url: p.image_url ?? '',
      is_active: p.is_active,
      sort_order: String(p.sort_order),
    })
    setPreview(p.image_url)
    setShowForm(true)
  }

  async function onImage(file: File | undefined) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const { url } = await uploadUmkmImage(file, 'product')
      setDraft((d) => ({ ...d, image_url: url }))
    } finally {
      setUploading(false)
    }
  }

  async function saveProduct() {
    setSaving(true)
    setLoadErr(null)
    try {
      const body = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price: Number(draft.price.replace(/[^\d.]/g, '')) || 0,
        image_url: draft.image_url || null,
        is_active: draft.is_active,
        sort_order: Number(draft.sort_order) || 0,
      }
      if (editingId) {
        await updateUmkmProduct(shopId, editingId, body)
      } else {
        await createUmkmProduct(shopId, body)
      }
      setShowForm(false)
      reload()
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  async function removeProduct(id: string) {
    if (!confirm('Hapus item menu ini?')) return
    try {
      await deleteUmkmProduct(shopId, id)
      reload()
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Menu / produk jualan</h2>
          <p className="text-sm text-muted-foreground">
            Seperti katalog di Gojek — nama item, detail, harga, dan foto.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Tambah item
        </Button>
      </div>

      {loadErr ? (
        <p className="text-sm text-destructive" role="alert">
          {loadErr}
        </p>
      ) : null}

      {showForm ? (
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="mb-3 text-sm font-medium">
            {editingId ? 'Edit item menu' : 'Item menu baru'}
          </p>
          <div className="grid gap-4 md:grid-cols-[140px_1fr]">
            <div className="space-y-2">
              <div className="aspect-square overflow-hidden rounded-lg border bg-background">
                {preview ? (
                  <img src={preview} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    Foto
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="mr-1 size-3.5" />
                Foto
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nama jualan *</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Es Kopi Susu"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Detail jualan</Label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={2}
                  placeholder="Gula aren, es batu, tanpa krim…"
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Harga jual (Rp) *</Label>
                <Input
                  inputMode="numeric"
                  value={draft.price}
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                  placeholder="15000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Urutan tampil</Label>
                <Input
                  inputMode="numeric"
                  value={draft.sort_order}
                  onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
                />
                Tampil di aplikasi warga
              </label>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void saveProduct()}>
              {saving ? 'Menyimpan…' : 'Simpan item'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Batal
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="size-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {p.description ? (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{p.description}</p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-right font-medium">{formatIdr(p.price)}</TableCell>
                <TableCell>
                  {p.is_active ? (
                    <Badge className="bg-emerald-600/90">Aktif</Badge>
                  ) : (
                    <Badge variant="secondary">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => void removeProduct(p.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada item menu. Tambah produk pertama.
          </p>
        ) : null}
      </div>
    </div>
  )
}
