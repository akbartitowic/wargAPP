import type { Request, Response } from 'express'
import * as billingService from '../services/billing.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'

export async function getCurrent(req: Request, res: Response): Promise<void> {
  const data = await billingService.getCurrentBilling(
    req.resident!.housing_complex_id,
    req.resident!.housing_unit_id,
    req.resident!.no_kk,
  )
  sendSuccess(res, data)
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  const data = await billingService.getBillingHistory(
    req.resident!.housing_complex_id,
    req.resident!.housing_unit_id,
  )
  sendSuccess(res, data)
}

export async function uploadProof(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new BadRequestError('File bukti transfer wajib diunggah (field: proof)')
  }
  const billingId = req.body.billing_id as string | undefined
  if (!billingId) throw new BadRequestError('billing_id wajib diisi')
  const data = await billingService.savePaymentProof(
    req.resident!.housing_complex_id,
    req.resident!.id,
    req.resident!.housing_unit_id,
    req.resident!.no_kk,
    billingId,
    { path: req.file.path, mimetype: req.file.mimetype, size: req.file.size },
  )
  sendSuccess(res, data, 201)
}
