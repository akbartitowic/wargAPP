import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  getNewsArticle,
  listHousingComplexes,
  updateNewsArticle,
  type NewsArticleDetail,
} from '@/api/admin'
import { NewsForm, type NewsFormValues } from '@/components/news/NewsForm'
import { getCmsSession } from '@/lib/cmsSession'
import { Button } from '@/components/ui/button'

function htmlToBody(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function bodyToHtml(body: string, excerpt: string): string {
  const parts = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
  return parts.length ? parts.join('') : `<p>${excerpt}</p>`
}

export function EditNewsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = getCmsSession()
  const [article, setArticle] = useState<NewsArticleDetail | null>(null)
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    if (session.is_super_admin) {
      void listHousingComplexes()
        .then((list) => setHousingOptions(list.map((h) => ({ id: h.id, name: h.name }))))
        .catch(() => setHousingOptions([]))
    }
  }, [session.is_super_admin])

  useEffect(() => {
    if (!id) return
    void getNewsArticle(id)
      .then((row) => {
        setArticle(row)
        setLoadErr(null)
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : 'Gagal memuat'))
  }, [id])

  async function onSubmit(values: NewsFormValues) {
    if (!id) return
    await updateNewsArticle(id, {
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt,
      body_html: bodyToHtml(values.body, values.excerpt),
      category_id: values.category_id,
      is_priority: values.is_priority,
      image_url: values.image_url,
    })
    navigate('/news')
  }

  if (!id) return <p className="text-sm text-destructive">ID tidak valid.</p>

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" render={<Link to="/news" />}>
        <ArrowLeft className="mr-1 size-4" />
        Kembali ke daftar
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Edit berita</h1>
        {article ? (
          <p className="mt-1 text-sm text-muted-foreground">{article.housing_name}</p>
        ) : null}
      </div>
      {loadErr ? (
        <p className="text-sm text-destructive" role="alert">
          {loadErr}
        </p>
      ) : null}
      {article ? (
        <NewsForm
          initial={{
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            body: htmlToBody(article.body_html),
            category_id: article.category_id ?? '',
            is_priority: article.is_priority,
            image_url: article.image_url,
            housing_complex_id: article.housing_complex_id,
          }}
          housingOptions={housingOptions}
          submitLabel="Simpan perubahan"
          onSubmit={onSubmit}
          onCancel={() => navigate('/news')}
        />
      ) : loadErr ? null : (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      )}
    </div>
  )
}
