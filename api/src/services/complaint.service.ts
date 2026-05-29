import { pool, query } from '../config/database.js'
import { publicUploadUrl } from '../config/env.js'
import { COMPLAINT_MAX_TOTAL_BYTES } from '../middlewares/complaintUpload.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'
import { resolveStoredUploadWebPath } from '../utils/uploadPath.js'
import * as complaintCategoryService from './complaintCategory.service.js'

export type ComplaintStatus =
  | 'submitted'
  | 'in_review'
  | 'in_progress'
  | 'closed'
  | 'rejected'

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Diajukan',
  in_review: 'Ditinjau',
  in_progress: 'Diproses',
  closed: 'Selesai',
  rejected: 'Ditolak',
}

export const COMPLAINT_PROGRESS_STEPS: { status: ComplaintStatus; label: string }[] = [
  { status: 'submitted', label: 'Diajukan' },
  { status: 'in_review', label: 'Ditinjau' },
  { status: 'in_progress', label: 'Diproses' },
  { status: 'closed', label: 'Selesai' },
]

function statusIndex(status: ComplaintStatus): number {
  if (status === 'rejected') return -1
  return COMPLAINT_PROGRESS_STEPS.findIndex((s) => s.status === status)
}

export function buildProgress(status: ComplaintStatus, reachedSteps?: number) {
  if (status === 'rejected') {
    const step = reachedSteps ?? 0
    return {
      percent: Math.round((step / COMPLAINT_PROGRESS_STEPS.length) * 100),
      current_step: step,
      total_steps: COMPLAINT_PROGRESS_STEPS.length,
      is_rejected: true,
      is_complete: false,
    }
  }
  const idx = statusIndex(status)
  const step = idx < 0 ? 0 : idx + 1
  return {
    percent: Math.round((step / COMPLAINT_PROGRESS_STEPS.length) * 100),
    current_step: step,
    total_steps: COMPLAINT_PROGRESS_STEPS.length,
    is_rejected: false,
    is_complete: status === 'closed',
  }
}

async function loadAttachments(complaintId: string) {
  const { rows } = await query<{
    id: string
    file_path: string
    mime_type: string
    file_size: number
    sort_order: number
  }>(
    `SELECT id::text, file_path, mime_type, file_size, sort_order
     FROM complaint_attachments
     WHERE complaint_id = $1
     ORDER BY sort_order, created_at`,
    [complaintId],
  )
  return rows.map((a) => ({
    id: a.id,
    mime_type: a.mime_type,
    file_size: a.file_size,
    file_url: publicUploadUrl(resolveStoredUploadWebPath(a.file_path)),
  }))
}

async function loadStatusLogs(complaintId: string) {
  const { rows } = await query<{
    status: ComplaintStatus
    note: string | null
    created_at: Date
  }>(
    `SELECT status, note, created_at
     FROM complaint_status_logs
     WHERE complaint_id = $1
     ORDER BY created_at ASC`,
    [complaintId],
  )
  return rows.map((l) => ({
    status: l.status,
    status_label: STATUS_LABELS[l.status],
    note: l.note,
    created_at: l.created_at.toISOString(),
  }))
}

function reachedStepCount(status: ComplaintStatus, history: ComplaintStatus[]): number {
  if (status !== 'rejected') {
    const idx = statusIndex(status)
    return idx < 0 ? 0 : idx + 1
  }
  let max = 0
  for (const s of history) {
    if (s === 'rejected') continue
    const idx = statusIndex(s)
    if (idx >= 0) max = Math.max(max, idx + 1)
  }
  return max
}

async function mapComplaintRow(row: {
  id: string
  category_label: string
  category_key: string
  description: string
  status: ComplaintStatus
  admin_note: string | null
  resident_name: string
  created_at: Date
  updated_at: Date
}) {
  const attachments = await loadAttachments(row.id)
  const status_history = await loadStatusLogs(row.id)
  const historyStatuses = status_history.map((h) => h.status as ComplaintStatus)
  const reachedCount = reachedStepCount(row.status, historyStatuses)

  return {
    id: row.id,
    category_label: row.category_label,
    category_key: row.category_key,
    description: row.description,
    status: row.status,
    status_label: STATUS_LABELS[row.status],
    admin_note: row.admin_note,
    resident_name: row.resident_name,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    progress: buildProgress(row.status, reachedCount),
    progress_steps: COMPLAINT_PROGRESS_STEPS.map((s, i) => ({
      ...s,
      status_label: STATUS_LABELS[s.status],
      reached: row.status === 'rejected' ? i < reachedCount : statusIndex(row.status) >= i,
      current: row.status === s.status,
    })),
    attachments,
    status_history,
  }
}

export async function listMyComplaints(residentId: string, housingComplexId: string) {
  const { rows } = await query<{
    id: string
    category_label: string
    category_key: string
    description: string
    status: ComplaintStatus
    admin_note: string | null
    resident_name: string
    created_at: Date
    updated_at: Date
  }>(
    `SELECT rc.id::text, cc.label AS category_label, cc.key AS category_key,
            rc.description, rc.status, rc.admin_note, r.nama AS resident_name,
            rc.created_at, rc.updated_at
     FROM resident_complaints rc
     JOIN complaint_categories cc ON cc.id = rc.category_id
     JOIN residents r ON r.id = rc.resident_id
     WHERE rc.resident_id = $1 AND rc.housing_complex_id = $2
     ORDER BY rc.created_at DESC`,
    [residentId, housingComplexId],
  )

  return Promise.all(
    rows.map(async (r) => {
      const full = await mapComplaintRow(r)
      return {
        id: full.id,
        category_label: full.category_label,
        description: full.description.slice(0, 120),
        status: full.status,
        status_label: full.status_label,
        created_at: full.created_at,
        progress: full.progress,
      }
    }),
  )
}

export async function getMyComplaint(
  residentId: string,
  housingComplexId: string,
  complaintId: string,
) {
  const { rows } = await query<{
    id: string
    category_label: string
    category_key: string
    description: string
    status: ComplaintStatus
    admin_note: string | null
    resident_name: string
    created_at: Date
    updated_at: Date
  }>(
    `SELECT rc.id::text, cc.label AS category_label, cc.key AS category_key,
            rc.description, rc.status, rc.admin_note, r.nama AS resident_name,
            rc.created_at, rc.updated_at
     FROM resident_complaints rc
     JOIN complaint_categories cc ON cc.id = rc.category_id
     JOIN residents r ON r.id = rc.resident_id
     WHERE rc.id = $1 AND rc.resident_id = $2 AND rc.housing_complex_id = $3`,
    [complaintId, residentId, housingComplexId],
  )
  if (!rows[0]) throw new NotFoundError('Komplain tidak ditemukan')
  return mapComplaintRow(rows[0])
}

export async function createComplaint(
  residentId: string,
  housingComplexId: string,
  input: {
    category_id: string
    description: string
    files: { path: string; mimetype: string; size: number }[]
  },
) {
  const description = input.description.trim()
  if (description.length < 10) {
    throw new BadRequestError('Deskripsi minimal 10 karakter')
  }

  const categories = await complaintCategoryService.listCategoriesForResident(housingComplexId)
  const category = categories.find((c) => c.id === input.category_id)
  if (!category) throw new BadRequestError('Kategori tidak valid')

  const totalSize = input.files.reduce((s, f) => s + f.size, 0)
  if (totalSize > COMPLAINT_MAX_TOTAL_BYTES) {
    throw new BadRequestError('Total lampiran maksimal 10 MB')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO resident_complaints
         (housing_complex_id, resident_id, category_id, description, status)
       VALUES ($1, $2, $3, $4, 'submitted')
       RETURNING id::text`,
      [housingComplexId, residentId, input.category_id, description],
    )
    const complaintId = rows[0]?.id
    if (!complaintId) throw new BadRequestError('Gagal membuat komplain')

    await client.query(
      `INSERT INTO complaint_status_logs (complaint_id, status, note)
       VALUES ($1, 'submitted', NULL)`,
      [complaintId],
    )

    for (let i = 0; i < input.files.length; i++) {
      const f = input.files[i]!
      await client.query(
        `INSERT INTO complaint_attachments (complaint_id, file_path, mime_type, file_size, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [complaintId, f.path, f.mimetype, f.size, i],
      )
    }

    await client.query('COMMIT')
    return getMyComplaint(residentId, housingComplexId, complaintId)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export { listCategoriesForResident } from './complaintCategory.service.js'
