import type { Request, Response } from 'express'
import { z } from 'zod'
import * as adminNewsService from '../services/adminNews.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'
import { writeAuditLog } from '../services/audit.service.js'

const newsSchema = z.object({
  housing_complex_id: z.string().uuid().optional(),
  title: z.string().min(3),
  slug: z.string().min(3),
  excerpt: z.string().min(10),
  body_html: z.string().min(10),
  category_id: z.string().uuid().optional(),
  category_key: z.string().optional(),
  is_priority: z.boolean().default(false),
  image_url: z.string().url().optional(),
  published_at: z.string().datetime().optional(),
  author_name: z.string().max(80).optional(),
  author_role: z.string().max(80).optional(),
})

const updateNewsSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).optional(),
  excerpt: z.string().min(10).optional(),
  body_html: z.string().min(10).optional(),
  category_id: z.string().uuid().optional(),
  is_priority: z.boolean().optional(),
  image_url: z.string().url().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  published_at: z.string().datetime().nullable().optional(),
})

export async function listNews(req: Request, res: Response): Promise<void> {
  const limit = Math.min(Number(req.query.limit ?? 50), 100)
  const offset = Number(req.query.offset ?? 0)
  const housing =
    typeof req.query.housing_complex_id === 'string' ? req.query.housing_complex_id : null
  sendSuccess(res, await adminNewsService.listNewsForAdmin(req.admin!, housing, limit, offset))
}

export async function getNews(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await adminNewsService.getNewsForAdmin(req.admin!, String(req.params.id)))
}

export async function publishNews(req: Request, res: Response): Promise<void> {
  const parsed = newsSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Payload tidak valid', parsed.error.flatten().fieldErrors)
  }
  if (!parsed.data.category_id && !parsed.data.category_key) {
    throw new BadRequestError('category_id atau category_key wajib diisi')
  }
  const data = await adminNewsService.publishNewsArticle(
    req.admin!,
    req.admin!.id,
    parsed.data,
    req.admin!.role,
  )
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.news.publish',
    entityType: 'news_article',
    entityId: data.id,
    payload: { slug: parsed.data.slug, is_priority: parsed.data.is_priority },
    req,
  })
  sendSuccess(res, data, 201)
}

export async function updateNews(req: Request, res: Response): Promise<void> {
  const parsed = updateNewsSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Payload tidak valid', parsed.error.flatten().fieldErrors)
  }
  const id = String(req.params.id)
  const data = await adminNewsService.updateNewsArticle(req.admin!, id, parsed.data)
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.news.update',
    entityType: 'news_article',
    entityId: id,
    req,
  })
  sendSuccess(res, data)
}
