import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { listHousingComplexes } from '@/api/admin'
import { createUmkmShop, getUmkmShop, updateUmkmShop } from '@/api/umkm'
import { ProductMenuSection } from '@/components/umkm/ProductMenuSection'
import { ShopForm, type ShopFormValues } from '@/components/umkm/ShopForm'
import { getCmsSession } from '@/lib/cmsSession'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function UmkmCreatePage() {
  const session = getCmsSession()
  const navigate = useNavigate()
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!session.is_super_admin) return
    void listHousingComplexes()
      .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
      .catch(() => setHousingOptions([]))
  }, [session.is_super_admin])

  async function handleSubmit(values: ShopFormValues) {
    const shop = await createUmkmShop(values)
    navigate(`/umkm/${shop.id}`)
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" render={<Link to="/umkm/toko" />}>
        <ArrowLeft className="mr-1 size-4" />
        Kembali
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tambah toko UMKM</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lengkapi profil merchant — setelah disimpan Anda dapat menambah menu jualan.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil toko</CardTitle>
          <CardDescription>Nama, kategori, detail, lokasi, dan WhatsApp pesanan.</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <ShopForm
            isSuperAdmin={session.is_super_admin}
            defaultHousingId={session.housing_complex_id}
            housingOptions={housingOptions}
            submitLabel="Simpan & lanjut ke menu"
            onCancel={() => navigate('/umkm/toko')}
            onSubmit={handleSubmit}
          />
        </div>
      </Card>
    </div>
  )
}

export function UmkmEditPage() {
  const { shopId } = useParams<{ shopId: string }>()
  const session = getCmsSession()
  const navigate = useNavigate()
  const [shop, setShop] = useState<Awaited<ReturnType<typeof getUmkmShop>> | null>(null)
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    if (!shopId) return
    void getUmkmShop(shopId)
      .then(setShop)
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [shopId])

  useEffect(() => {
    if (!session.is_super_admin) return
    void listHousingComplexes()
      .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
      .catch(() => setHousingOptions([]))
  }, [session.is_super_admin])

  async function handleSubmit(values: ShopFormValues) {
    if (!shopId) return
    await updateUmkmShop(shopId, values)
    const refreshed = await getUmkmShop(shopId)
    setShop(refreshed)
  }

  if (loadErr) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {loadErr}
      </p>
    )
  }

  if (!shop) {
    return <p className="text-sm text-muted-foreground">Memuat…</p>
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" render={<Link to="/umkm/toko" />}>
        <ArrowLeft className="mr-1 size-4" />
        Daftar toko
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{shop.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {shop.category} · {shop.housing_name} · {shop.open_time}–{shop.close_time}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil toko</CardTitle>
          <CardDescription>Edit informasi merchant.</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <ShopForm
            initial={{ ...shop, housing_complex_id: shop.housing_complex_id }}
            isSuperAdmin={session.is_super_admin}
            defaultHousingId={session.housing_complex_id}
            housingOptions={housingOptions}
            submitLabel="Simpan perubahan"
            onCancel={() => navigate('/umkm/toko')}
            onSubmit={handleSubmit}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Katalog menu</CardTitle>
        </CardHeader>
        <div className="p-6 pt-0">
          <ProductMenuSection shopId={shop.id} />
        </div>
      </Card>
    </div>
  )
}
