import type { Request, Response } from 'express'
import * as facilityService from '../services/facility.service.js'
import { sendSuccess } from '../utils/response.js'

export async function list(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await facilityService.listFacilities(req.resident!.housing_complex_id))
}

export async function getById(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await facilityService.getFacilityById(
      req.resident!.housing_complex_id,
      String(req.params.id),
    ),
  )
}
