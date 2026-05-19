import type { Request, Response } from 'express'
import * as newsService from '../services/news.service.js'
import { sendSuccess } from '../utils/response.js'

export async function listCategories(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await newsService.listNewsCategories(req.resident!.housing_complex_id))
}

export async function list(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await newsService.listNews(req.resident!.housing_complex_id))
}

export async function getBySlug(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await newsService.getNewsBySlug(
    req.resident!.housing_complex_id,
    String(req.params.slug),
  ))
}
