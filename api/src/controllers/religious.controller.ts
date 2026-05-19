import type { Request, Response } from 'express'
import * as religiousService from '../services/religious.service.js'
import { sendSuccess } from '../utils/response.js'

export async function getSchedule(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await religiousService.getSchedule(
    req.resident!.housing_complex_id,
    req.resident!.id,
    req.query.type as string | undefined,
  ))
}

export async function listPlaces(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await religiousService.listPlaces(
    req.resident!.housing_complex_id,
    req.resident!.id,
  ))
}
