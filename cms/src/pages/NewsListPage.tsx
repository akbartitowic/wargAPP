import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Newspaper, Pencil, Plus, Tags } from 'lucide-react'
import { listHousingComplexes, listNewsArticles, type NewsArticleRow } from '@/api/admin'
import { getCmsSession } from '@/lib/cmsSession'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function statusBadge(status: string) {
  if (status === 'published') {
    return <Badge className="bg-emerald-600/90 hover:bg-emerald-600/90">Terbit</Badge>
  }
  if (status === 'draft') return <Badge variant="secondary">Draft</Badge>
  return <Badge variant="outline">Arsip</Badge>
}

export function NewsListPage() {
  const session = getCmsSession()
  const [rows, setRows] = useState<NewsArticleRow[]>([])
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [filterHousing, setFilterHousing] = useState(session.housing_complex_id ?? '')
  const [loadErr, setLoadErr] = useState<string | null>(null)

  const reload = useCallback(() => {
    const housingParam = session.is_super_admin ? filterHousing || undefined : undefined
    void listNewsArticles(housingParam)
      .then((data) => {
        setRows(data)
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [filterHousing, session.is_super_admin])

  useEffect(() => {
    if (session.is_super_admin) {
      void listHousingComplexes()
        .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
        .catch(() => setHousingOptions([]))
    }
    reload()
  }, [reload, session.is_super_admin])

  useEffect(() => {
    if (session.is_super_admin) reload()
  }, [filterHousing, session.is_super_admin, reload])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Newspaper className="size-7 text-primary" />
            Daftar berita
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola artikel yang tampil di aplikasi warga. Kategori mengikuti master kategori.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link to="/news/categories" />}>
            <Tags className="mr-2 size-4" />
            Master kategori
          </Button>
          <Button render={<Link to="/news/new" />}>
            <Plus className="mr-2 size-4" />
            Tulis berita
          </Button>
        </div>
      </div>

      {loadErr ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {loadErr}
        </p>
      ) : null}

      {session.is_super_admin ? (
        <label className="block max-w-md text-sm">
          Filter perumahan
          <select
            value={filterHousing}
            onChange={(e) => setFilterHousing(e.target.value)}
            className="mt-1 w-full rounded-md border px-2 py-1.5"
          >
            <option value="">Semua perumahan</option>
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
          <CardTitle className="text-base">Artikel</CardTitle>
          <CardDescription>Urutan terbaru di atas.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto p-6 pt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-3">Judul</th>
                <th className="pb-2 pr-3">Kategori</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Perumahan</th>
                <th className="pb-2 w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium">{row.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">{row.slug}</div>
                    {row.is_priority ? (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Prioritas
                      </Badge>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-3">{row.category}</td>
                  <td className="py-2.5 pr-3">{statusBadge(row.status)}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{row.housing_name}</td>
                  <td className="py-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      render={<Link to={`/news/${row.id}/edit`} />}
                    >
                      <Pencil className="mr-1 size-3.5" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada berita.</p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
