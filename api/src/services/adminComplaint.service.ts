import { pool, query } from '../config/database.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'
import type { AdminTenantContext } from '../utils/tenant.js'
import { resolveHousingComplexId, resolveHousingFilter } from '../utils/tenant.js'
import {
  buildProgress,
  COMPLAINT_PROGRESS_STEPS,
  type ComplaintStatus,
} from './complaint.service.js'
import * as complaintService from './complaint.service.js'

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Diajukan',
  in_review: 'Ditinjau',
  in_progress: 'Diproses',
  closed: 'Selesai',
  rejected: 'Ditolak',
}

const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  submitted: ['in_review', 'rejected'],
  in_review: ['in_progress', 'rejected'],
  in_progress: ['closed', 'rejected'],
  closed: [],
  rejected: [],
}

export async function listComplaints(
  admin: AdminTenantContext,
  opts: { housingFilter?: string | null; status?: string | null },
) {
  const housingId = resolveHousingFilter(admin, opts.housingFilter)
  let sql = `
    SELECT rc.id::text, cc.label AS category_label, r.nama AS resident_name,
           rc.description, rc.status, rc.created_at, rc.updated_at
    FROM resident_complaints rc
    JOIN complaint_categories cc ON cc.id = rc.category_id
    JOIN residents r ON r.id = rc.resident_id
    WHERE 1=1`
  const params: unknown[] = []

  if (housingId) {
    params.push(housingId)
    sql += ` AND rc.housing_complex_id = $${params.length}`
  }

  if (opts.status && opts.status !== 'all') {
    params.push(opts.status)
    sql += ` AND rc.status = $${params.length}`
  }

  sql += ` ORDER BY rc.created_at DESC LIMIT 200`

  const { rows } = await query<{
    id: string
    category_label: string
    resident_name: string
    description: string
    status: ComplaintStatus
    created_at: Date
    updated_at: Date
  }>(sql, params)

  return rows.map((r) => ({
    id: r.id,
    category_label: r.category_label,
    resident_name: r.resident_name,
    description: r.description.slice(0, 160),
    status: r.status,
    status_label: STATUS_LABELS[r.status],
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
    progress: buildProgress(r.status),
  }))
}

export async function getComplaint(admin: AdminTenantContext, complaintId: string) {
  const { rows } = await query<{
    id: string
    housing_complex_id: string
    resident_id: string
    category_label: string
    category_key: string
    description: string
    status: ComplaintStatus
    admin_note: string | null
    resident_name: string
    resident_phone: string
    created_at: Date
    updated_at: Date
  }>(
    `SELECT rc.id::text, rc.housing_complex_id::text, rc.resident_id::text,
            cc.label AS category_label, cc.key AS category_key,
            rc.description, rc.status, rc.admin_note,
            r.nama AS resident_name, r.no_hp AS resident_phone,
            rc.created_at, rc.updated_at
     FROM resident_complaints rc
     JOIN complaint_categories cc ON cc.id = rc.category_id
     JOIN residents r ON r.id = rc.resident_id
     WHERE rc.id = $1`,
    [complaintId],
  )
  if (!rows[0]) throw new NotFoundError('Komplain tidak ditemukan')
  resolveHousingComplexId(admin, rows[0].housing_complex_id)

  const detail = await complaintService.getMyComplaint(
    rows[0].resident_id,
    rows[0].housing_complex_id,
    complaintId,
  )

  return {
    ...detail,
    resident_phone: rows[0].resident_phone,
    progress_steps: COMPLAINT_PROGRESS_STEPS.map((s) => ({
      ...s,
      status_label: STATUS_LABELS[s.status],
    })),
  }
}

export async function updateComplaintStatus(
  admin: AdminTenantContext,
  complaintId: string,
  adminId: string,
  input: { status: ComplaintStatus; note?: string | null },
) {
  const { rows } = await query<{
    id: string
    housing_complex_id: string
    status: ComplaintStatus
  }>(
    `SELECT id::text, housing_complex_id::text, status
     FROM resident_complaints WHERE id = $1`,
    [complaintId],
  )
  if (!rows[0]) throw new NotFoundError('Komplain tidak ditemukan')
  resolveHousingComplexId(admin, rows[0].housing_complex_id)

  const current = rows[0].status
  const next = input.status
  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new BadRequestError(
      `Status tidak dapat diubah dari ${STATUS_LABELS[current]} ke ${STATUS_LABELS[next]}`,
    )
  }

  if (next === 'rejected' && !input.note?.trim()) {
    throw new BadRequestError('Catatan penolakan wajib diisi')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE resident_complaints
       SET status = $2, admin_note = $3, reviewed_by = $4, updated_at = NOW()
       WHERE id = $1`,
      [complaintId, next, input.note?.trim() || null, adminId],
    )
    await client.query(
      `INSERT INTO complaint_status_logs (complaint_id, status, note, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [complaintId, next, input.note?.trim() || null, adminId],
    )
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }

  return getComplaint(admin, complaintId)
}
