import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { listHousingComplexes, publishNews } from '@/api/admin'
import { NewsForm, type NewsFormValues } from '@/components/news/NewsForm'
import { getCmsSession } from '@/lib/cmsSession'
import { Button } from '@/components/ui/button'

function bodyToHtml(body: string, excerpt: string): string {
  const parts = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
  return parts.length ? parts.join('') : `<p>${excerpt}</p>`
}

export function CreateNewsPage() {
  const navigate = useNavigate()
  const session = getCmsSession()
  const [housingOptions, setHousingOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!session.is_super_admin) return
    void listHousingComplexes()
      .then((list) =>
        setHousingOptions(
          list
            .filter((h) => h.status !== 'inactive')
            .map((h) => ({ id: h.id, name: h.name })),
        ),
      )
      .catch(() => setHousingOptions([]))
  }, [session.is_super_admin])

  async function onSubmit(values: NewsFormValues) {
    await publishNews({
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt,
      body_html: bodyToHtml(values.body, values.excerpt),
      category_id: values.category_id,
      is_priority: values.is_priority,
      ...(values.image_url ? { image_url: values.image_url } : {}),
      ...(values.housing_complex_id ? { housing_complex_id: values.housing_complex_id } : {}),
    })
    navigate('/news')
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" render={<Link to="/news" />}>
        <ArrowLeft className="mr-1 size-4" />
        Kembali ke daftar
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Tulis berita baru</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Artikel akan langsung dipublikasikan ke aplikasi warga.
        </p>
      </div>
      <NewsForm
        housingOptions={housingOptions}
        submitLabel="Publish"
        onSubmit={onSubmit}
        onCancel={() => navigate('/news')}
      />
    </div>
  )
}
