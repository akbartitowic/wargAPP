import type { Request, Response } from 'express'
import * as homeService from '../services/home.service.js'
import { sendSuccess } from '../utils/response.js'

export async function getConfig(req: Request, res: Response): Promise<void> {
  const data = await homeService.getHomeConfig(req.resident!.housing_complex_id)
  sendSuccess(res, data)
}
