import type { Request, Response } from 'express'
import {
  COMPLAINT_MAX_TOTAL_BYTES,
  complaintStoredPath,
} from '../middlewares/complaintUpload.js'
import * as complaintService from '../services/complaint.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'

export async function listCategories(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await complaintService.listCategoriesForResident(req.resident!.housing_complex_id),
  )
}

export async function listMine(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await complaintService.listMyComplaints(
      req.resident!.id,
      req.resident!.housing_complex_id,
    ),
  )
}

export async function getById(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await complaintService.getMyComplaint(
      req.resident!.id,
      req.resident!.housing_complex_id,
      String(req.params.id),
    ),
  )
}

export async function create(req: Request, res: Response): Promise<void> {
  const category_id = req.body.category_id as string | undefined
  const description = req.body.description as string | undefined
  if (!category_id) throw new BadRequestError('Kategori wajib dipilih')
  if (!description?.trim()) throw new BadRequestError('Deskripsi wajib diisi')

  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  const totalSize = files.reduce((s, f) => s + f.size, 0)
  if (totalSize > COMPLAINT_MAX_TOTAL_BYTES) {
    throw new BadRequestError('Total lampiran maksimal 10 MB')
  }

  const data = await complaintService.createComplaint(
    req.resident!.id,
    req.resident!.housing_complex_id,
    {
      category_id,
      description,
      files: files.map((f) => ({
        path: complaintStoredPath(f.path),
        mimetype: f.mimetype,
        size: f.size,
      })),
    },
  )
  sendSuccess(res, data, 201)
}
