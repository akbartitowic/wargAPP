import type { Request, Response } from 'express'
import { z } from 'zod'
import * as adminComplaintService from '../services/adminComplaint.service.js'
import { writeAuditLog } from '../services/audit.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'

const statusSchema = z.object({
  status: z.enum(['in_review', 'in_progress', 'closed', 'rejected']),
  note: z.string().max(2000).optional().nullable(),
})

export async function listComplaints(req: Request, res: Response): Promise<void> {
  const housing =
    typeof req.query.housing_complex_id === 'string' ? req.query.housing_complex_id : null
  const status = typeof req.query.status === 'string' ? req.query.status : null
  sendSuccess(res, await adminComplaintService.listComplaints(req.admin!, { housingFilter: housing, status }))
}

export async function getComplaint(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await adminComplaintService.getComplaint(req.admin!, String(req.params.id)))
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Data status tidak valid', parsed.error.flatten().fieldErrors)
  }
  const complaintId = String(req.params.id)
  const data = await adminComplaintService.updateComplaintStatus(
    req.admin!,
    complaintId,
    req.admin!.id,
    parsed.data,
  )
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.complaint.status',
    entityType: 'resident_complaint',
    entityId: complaintId,
    payload: { status: parsed.data.status },
    req,
  })
  sendSuccess(res, data)
}
