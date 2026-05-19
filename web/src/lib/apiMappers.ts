import type { ApiNewsDetail, ApiNewsItem } from '@/config/api/endpoints'
import type { NewsItem } from '@/data/news'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Baru saja'
  if (h < 24) return `${h} Jam`
  const d = Math.floor(h / 24)
  return `${d} Hari`
}

const PLACEHOLDER_IMG = 'https://picsum.photos/seed/warga-news/1280/720'

export function mapApiNewsToItem(n: ApiNewsItem): NewsItem {
  const img = n.image_url ?? PLACEHOLDER_IMG
  const label = n.category || 'Pengumuman'
  return {
    slug: n.slug,
    title: n.title,
    excerpt: n.excerpt,
    listSnippet: n.excerpt.slice(0, 80),
    imageSrc: img,
    publishedAt: n.published_at,
    filterCategory: label,
    displayTag: label,
    heroRibbon: n.is_priority ? 'PENTING' : undefined,
    is_priority: n.is_priority,
    featuredTimeLabel: timeAgo(n.published_at),
    listTimeLabel: timeAgo(n.published_at),
    authorName: n.author_name ?? 'Pengurus RT',
    authorRole: n.author_role ?? 'Admin',
    body: [],
  }
}

export function mapApiNewsDetail(n: ApiNewsDetail): NewsItem {
  const base = mapApiNewsToItem(n)
  const paragraphs = n.body_html
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return {
    ...base,
    body: paragraphs.length ? paragraphs : [n.excerpt],
  }
}
