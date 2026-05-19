import type { Request, Response } from 'express'
import { z } from 'zod'
import { publicUploadUrl } from '../config/env.js'
import { newsHeroUpload, processNewsHeroImage } from '../middlewares/newsUpload.js'
import * as adminService from '../services/admin.service.js'
import * as adminBillingService from '../services/adminBilling.service.js'
import * as housingUnitService from '../services/housingUnit.service.js'
import { listAuditLogs, writeAuditLog } from '../services/audit.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError, ValidationError } from '../utils/errors.js'
import { maskSensitiveId } from '../utils/masking.js'

const AGAMA_VALUES = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Khonghucu',
  'Lainnya',
] as const

const createUserSchema = z.object({
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  no_kk: z
    .string()
    .trim()
    .regex(/^\d{16}$/, 'No. KK harus 16 digit angka'),
  nama: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  no_hp: z
    .string()
    .trim()
    .regex(/^08\d{8,11}$/, 'No. HP format Indonesia (contoh: 081234567890)'),
  nama_jalan: z.string().trim().min(2, 'Nama jalan wajib diisi'),
  blok_rumah: z.string().trim().min(1, 'Blok rumah wajib diisi'),
  rt: z.string().trim().min(1, 'RT wajib diisi').max(5),
  rw: z.string().trim().min(1, 'RW wajib diisi').max(5),
  agama: z.enum(AGAMA_VALUES),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  is_parent: z.coerce.boolean().optional().default(false),
  housing_complex_id: z.string().uuid().optional(),
  occupancy_type: z.enum(['pemilik', 'kontrak']).optional().default('pemilik'),
  residence_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD')
    .optional(),
  residence_end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD')
    .nullable()
    .optional(),
  owner_resident_id: z.string().uuid().optional().nullable(),
  housing_unit_id: z.string().uuid().optional(),
  allows_multiple_kk: z.coerce.boolean().optional(),
})

export async function listHousingUnits(req: Request, res: Response): Promise<void> {
  const housing =
    typeof req.query.housing_complex_id === 'string' ? req.query.housing_complex_id : null
  const search = typeof req.query.q === 'string' ? req.query.q : undefined
  const housingId = housing ?? req.admin!.housing_complex_id
  if (!housingId) {
    throw new BadRequestError('Pilih perumahan')
  }
  sendSuccess(res, await housingUnitService.listHousingUnitsForAdmin(housingId, search))
}

export async function listUnitKk(req: Request, res: Response): Promise<void> {
  const unitId = String(req.params.unitId)
  sendSuccess(res, await housingUnitService.listKkAtUnit(unitId))
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const limit = Math.min(Number(req.query.limit ?? 50), 100)
  const offset = Number(req.query.offset ?? 0)
  const housing = typeof req.query.housing_complex_id === 'string' ? req.query.housing_complex_id : null
  sendSuccess(res, await adminService.listResidents(req.admin!, limit, offset, housing))
}

export async function listAudit(req: Request, res: Response): Promise<void> {
  const limit = Math.min(Number(req.query.limit ?? 50), 200)
  const offset = Number(req.query.offset ?? 0)
  sendSuccess(res, await listAuditLogs(limit, offset))
}

const updateUserSchema = z.object({
  nama: z.string().trim().min(2).max(120).optional(),
  no_hp: z
    .string()
    .trim()
    .regex(/^08\d{8,11}$/, 'No. HP format Indonesia (contoh: 081234567890)')
    .optional(),
  nama_jalan: z.string().trim().min(2).max(120).optional(),
  blok_rumah: z.string().trim().min(1).max(32).optional(),
  rt: z.string().trim().min(1).max(5).optional(),
  rw: z.string().trim().min(1).max(5).optional(),
  agama: z.enum(AGAMA_VALUES).optional(),
  is_parent: z.coerce.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  password: z.string().min(8, 'Password minimal 8 karakter').optional().or(z.literal('')),
  occupancy_type: z.enum(['pemilik', 'kontrak']).optional(),
  residence_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD')
    .optional(),
  residence_end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD')
    .nullable()
    .optional(),
  owner_resident_id: z.string().uuid().optional().nullable(),
  housing_unit_id: z.string().uuid().optional(),
  allows_multiple_kk: z.coerce.boolean().optional(),
})

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

const accountStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
})

export async function getUser(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id)
  sendSuccess(res, await adminService.getResidentForAdmin(req.admin!, id))
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Data warga tidak valid', parsed.error.flatten().fieldErrors)
  }
  const data = await adminService.createResident(req.admin!, parsed.data)
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.user.create',
    entityType: 'resident',
    entityId: data.id,
    payload: { nik: maskSensitiveId(parsed.data.nik) },
    req,
  })
  sendSuccess(res, data, 201)
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const parsed = updateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Data warga tidak valid', parsed.error.flatten().fieldErrors)
  }

  const id = String(req.params.id)
  const password =
    parsed.data.password && parsed.data.password.length > 0 ? parsed.data.password : undefined

  const data = await adminService.updateResident(req.admin!, id, {
    ...parsed.data,
    password,
  })
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.user.update',
    entityType: 'resident',
    entityId: id,
    payload: { ...parsed.data, password: password ? '[changed]' : undefined },
    req,
  })
  sendSuccess(res, data)
}

export async function resetUserPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Password tidak valid', parsed.error.flatten().fieldErrors)
  }
  const id = String(req.params.id)
  const data = await adminService.resetResidentPassword(req.admin!, id, parsed.data.password)
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.user.reset_password',
    entityType: 'resident',
    entityId: id,
    req,
  })
  sendSuccess(res, data)
}

export async function setUserAccountStatus(req: Request, res: Response): Promise<void> {
  const parsed = accountStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Status tidak valid')
  }
  const id = String(req.params.id)
  const data = await adminService.setResidentAccountStatus(req.admin!, id, parsed.data.status)
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.user.account_status',
    entityType: 'resident',
    entityId: id,
    payload: { status: parsed.data.status },
    req,
  })
  sendSuccess(res, data)
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id)
  const data = await adminService.softDeleteResident(req.admin!, id)
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.user.deactivate',
    entityType: 'resident',
    entityId: id,
    req,
  })
  sendSuccess(res, data)
}

const lineItemSchema = z.object({
  item_name: z.string().min(1).max(80),
  amount: z.coerce.number().positive(),
})

const generateBillsSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  housing_complex_id: z.string().uuid().optional(),
  due_date: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1).optional(),
})

const expenseSchema = z.object({
  housing_complex_id: z.string().uuid().optional(),
  period_year: z.coerce.number().int(),
  period_month: z.coerce.number().int().min(1).max(12),
  title: z.string().min(2).max(120),
  amount: z.coerce.number().positive(),
  category: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
  spent_at: z.string().optional(),
})

export async function getBillingDashboard(req: Request, res: Response): Promise<void> {
  const housing =
    typeof req.query.housing_complex_id === 'string' ? req.query.housing_complex_id : null
  const year = req.query.year ? Number(req.query.year) : undefined
  const month = req.query.month ? Number(req.query.month) : undefined
  sendSuccess(
    res,
    await adminBillingService.getBillingDashboard(req.admin!, { housing_complex_id: housing, year, month }),
  )
}

export async function listUnpaidBillings(req: Request, res: Response): Promise<void> {
  const periodId = String(req.query.period_id ?? '')
  if (!periodId) throw new BadRequestError('period_id wajib diisi')
  sendSuccess(res, await adminBillingService.listUnpaidBillings(req.admin!, periodId))
}

export async function generateBills(req: Request, res: Response): Promise<void> {
  const parsed = generateBillsSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Data tagihan tidak valid', parsed.error.flatten().fieldErrors)
  }
  const line_items =
    parsed.data.line_items ?? adminBillingService.DEFAULT_LINE_ITEMS
  const data = await adminBillingService.generateMonthlyBills(req.admin!, {
    year: parsed.data.year,
    month: parsed.data.month,
    housing_complex_id: parsed.data.housing_complex_id,
    due_date: parsed.data.due_date,
    line_items,
  })
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.billing.generate',
    entityType: 'billing_period',
    entityId: data.period_id,
    payload: {
      year: parsed.data.year,
      month: parsed.data.month,
      bills_created: data.bills_created,
      bills_skipped: data.bills_skipped,
      billable_kk: data.billable_kk,
      total_per_kk: data.total_per_kk,
    },
    req,
  })
  sendSuccess(res, data, 201)
}

export async function createIplExpense(req: Request, res: Response): Promise<void> {
  const parsed = expenseSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Data pengeluaran tidak valid', parsed.error.flatten().fieldErrors)
  }
  const data = await adminBillingService.createExpense(req.admin!, parsed.data, req.admin!.id)
  sendSuccess(res, data, 201)
}

export async function deleteIplExpense(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await adminBillingService.deleteExpense(req.admin!, String(req.params.id)))
}

export async function listBillingApproval(req: Request, res: Response): Promise<void> {
  const housing =
    typeof req.query.housing_complex_id === 'string' ? req.query.housing_complex_id : null
  sendSuccess(res, await adminService.listPendingProofs(req.admin!, housing))
}

export async function approveBilling(req: Request, res: Response): Promise<void> {
  const proofId = String(req.params.id)
  const data = await adminService.approvePayment(req.admin!, proofId, req.admin!.id)
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.billing.approve',
    entityType: 'payment_proof',
    entityId: proofId,
    payload: data,
    req,
  })
  sendSuccess(res, data)
}

export async function uploadNewsHero(req: Request, res: Response): Promise<void> {
  if (!req.file?.buffer) throw new BadRequestError('File gambar wajib (field: image)')
  const processed = await processNewsHeroImage(req.file.buffer)
  const url = publicUploadUrl(processed.relativePath)
  await writeAuditLog({
    actorType: 'admin',
    actorId: req.admin!.id,
    action: 'admin.news.upload_hero',
    entityType: 'news_asset',
    payload: { path: processed.relativePath },
    req,
  })
  sendSuccess(res, { url, path: processed.relativePath }, 201)
}

export { newsHeroUpload }

