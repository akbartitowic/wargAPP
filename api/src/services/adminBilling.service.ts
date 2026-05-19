import { query } from '../config/database.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'
import type { AdminTenantContext } from '../utils/tenant.js'
import { assertHousingExists, resolveHousingComplexId, resolveHousingFilter } from '../utils/tenant.js'

export type LineItemInput = { item_name: string; amount: number }

export const DEFAULT_LINE_ITEMS: LineItemInput[] = [
  { item_name: 'Keamanan', amount: 100_000 },
  { item_name: 'Kebersihan', amount: 100_000 },
  { item_name: 'Kas RT', amount: 50_000 },
]

function sumLines(items: LineItemInput[]): number {
  return items.reduce((s, l) => s + l.amount, 0)
}

function periodLabel(year: number, month: number): string {
  return `TAGIHAN ${new Date(year, month - 1).toLocaleString('id-ID', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase()}`
}

/** Alamat layak ditagih: ada warga aktif ≥1 bulan di periode, kontrak masih berlaku. */
const BILLABLE_UNIT_SQL = `
  SELECT DISTINCT r.housing_unit_id
  FROM residents r
  WHERE r.housing_complex_id = $1
    AND r.housing_unit_id IS NOT NULL
    AND r.status = 'active'
    AND r.deleted_at IS NULL
    AND r.residence_start_date + INTERVAL '1 month' <= make_date($2::int, $3::int, 1)
    AND (
      r.residence_end_date IS NULL
      OR r.residence_end_date >= make_date($2::int, $3::int, 1)
    )
`

async function countActiveUnits(housingId: string): Promise<number> {
  const { rows } = await query<{ n: number }>(
    `SELECT COUNT(DISTINCT housing_unit_id)::int AS n FROM residents
     WHERE housing_complex_id = $1 AND housing_unit_id IS NOT NULL
       AND status = 'active' AND deleted_at IS NULL`,
    [housingId],
  )
  return rows[0]?.n ?? 0
}

async function listBillableUnits(
  housingId: string,
  year: number,
  month: number,
): Promise<{ housing_unit_id: string }[]> {
  const { rows } = await query<{ housing_unit_id: string }>(BILLABLE_UNIT_SQL, [
    housingId,
    year,
    month,
  ])
  return rows
}

export async function getBillingDashboard(
  admin: AdminTenantContext,
  opts: { housing_complex_id?: string | null; year?: number; month?: number },
) {
  const housingId = resolveHousingFilter(admin, opts.housing_complex_id)
  if (!housingId) {
    throw new BadRequestError('Pilih perumahan untuk melihat ringkasan tagihan')
  }

  const year = opts.year ?? new Date().getFullYear()
  const month = opts.month ?? new Date().getMonth() + 1

  const total_kk = await countActiveUnits(housingId)
  const { rows: billableRows } = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM (${BILLABLE_UNIT_SQL}) eligible`,
    [housingId, year, month],
  )
  const billable_kk = billableRows[0]?.n ?? 0

  const { rows: periodRows } = await query<{
    id: string
    label: string
    due_date: string
    line_template: LineItemInput[] | null
  }>(
    `SELECT id::text, label, due_date::text, line_template
     FROM billing_periods
     WHERE housing_complex_id = $1 AND period_year = $2 AND period_month = $3`,
    [housingId, year, month],
  )
  const period = periodRows[0]

  let period_summary = {
    period_id: null as string | null,
    label: periodLabel(year, month),
    due_date: null as string | null,
    line_template: DEFAULT_LINE_ITEMS as LineItemInput[],
    total_kk,
    billable_kk,
    paid_kk: 0,
    unpaid_kk: 0,
    pending_kk: 0,
    collected_amount: 0,
    outstanding_amount: 0,
    expected_amount: 0,
  }

  if (period) {
    const { rows: stats } = await query<{
      paid_kk: number
      unpaid_kk: number
      pending_kk: number
      collected: string
      outstanding: string
      expected: string
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_kk,
         COUNT(*) FILTER (WHERE status = 'unpaid')::int AS unpaid_kk,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_kk,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0)::text AS collected,
         COALESCE(SUM(total_amount) FILTER (WHERE status IN ('unpaid','pending')), 0)::text AS outstanding,
         COALESCE(SUM(total_amount), 0)::text AS expected
       FROM billings WHERE period_id = $1`,
      [period.id],
    )
    const s = stats[0]
    period_summary = {
      period_id: period.id,
      label: period.label,
      due_date: period.due_date,
      line_template:
        Array.isArray(period.line_template) && period.line_template.length
          ? period.line_template
          : DEFAULT_LINE_ITEMS,
      total_kk,
      billable_kk,
      paid_kk: s?.paid_kk ?? 0,
      unpaid_kk: s?.unpaid_kk ?? 0,
      pending_kk: s?.pending_kk ?? 0,
      collected_amount: Number(s?.collected ?? 0),
      outstanding_amount: Number(s?.outstanding ?? 0),
      expected_amount: Number(s?.expected ?? 0),
    }
  }

  const { rows: incomeRows } = await query<{
    period_year: number
    period_month: number
    label: string
    collected: string
    bill_count: number
  }>(
    `SELECT bp.period_year, bp.period_month, bp.label,
            COALESCE(SUM(b.total_amount) FILTER (WHERE b.status = 'paid'), 0)::text AS collected,
            COUNT(b.id) FILTER (WHERE b.status = 'paid')::int AS bill_count
     FROM billing_periods bp
     LEFT JOIN billings b ON b.period_id = bp.id
     WHERE bp.housing_complex_id = $1 AND bp.period_year = $2
     GROUP BY bp.period_year, bp.period_month, bp.label
     ORDER BY bp.period_month`,
    [housingId, year],
  )

  const income_by_month = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const row = incomeRows.find((r) => r.period_month === m)
    return {
      month: m,
      label: row?.label ?? periodLabel(year, m),
      collected: Number(row?.collected ?? 0),
      bill_count: row?.bill_count ?? 0,
    }
  })

  const { rows: expenseRows } = await query<{ period_month: number; total: string }>(
    `SELECT period_month, COALESCE(SUM(amount), 0)::text AS total
     FROM ipl_expenses
     WHERE housing_complex_id = $1 AND period_year = $2
     GROUP BY period_month
     ORDER BY period_month`,
    [housingId, year],
  )

  const expense_by_month = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total: Number(expenseRows.find((r) => r.period_month === i + 1)?.total ?? 0),
  }))

  const { rows: monthExpenses } = await query<{
    id: string
    title: string
    amount: string
    category: string
    notes: string | null
    spent_at: string
  }>(
    `SELECT id::text, title, amount::text, category, notes, spent_at::text
     FROM ipl_expenses
     WHERE housing_complex_id = $1 AND period_year = $2 AND period_month = $3
     ORDER BY spent_at DESC, created_at DESC`,
    [housingId, year, month],
  )

  return {
    housing_complex_id: housingId,
    year,
    month,
    period: period_summary,
    income_by_month,
    expense_by_month,
    expenses_current_month: monthExpenses.map((e) => ({
      id: e.id,
      title: e.title,
      amount: Number(e.amount),
      category: e.category,
      notes: e.notes,
      spent_at: e.spent_at,
    })),
    expenses_current_month_total: monthExpenses.reduce((s, e) => s + Number(e.amount), 0),
  }
}

export async function listUnpaidBillings(
  admin: AdminTenantContext,
  periodId: string,
) {
  const { rows: period } = await query<{ housing_complex_id: string }>(
    `SELECT housing_complex_id::text FROM billing_periods WHERE id = $1`,
    [periodId],
  )
  if (!period[0]) throw new NotFoundError('Periode tagihan tidak ditemukan')
  resolveHousingComplexId(admin, period[0].housing_complex_id)

  const { rows } = await query<{
    billing_id: string
    housing_unit_id: string
    blok_rumah: string
    resident_name: string
    kk_labels: string | null
    total_amount: string
    status: string
  }>(
    `SELECT b.id::text AS billing_id, b.housing_unit_id::text,
            u.blok_rumah,
            (
              SELECT r.nama FROM residents r
              WHERE r.housing_unit_id = b.housing_unit_id
                AND r.is_parent AND r.status = 'active' AND r.deleted_at IS NULL
              LIMIT 1
            ) AS resident_name,
            (
              SELECT string_agg(sub.no_kk, ', ' ORDER BY sub.no_kk)
              FROM (
                SELECT DISTINCT no_kk FROM residents
                WHERE housing_unit_id = b.housing_unit_id AND deleted_at IS NULL
              ) sub
            ) AS kk_labels,
            b.total_amount::text, b.status::text
     FROM billings b
     JOIN housing_units u ON u.id = b.housing_unit_id
     WHERE b.period_id = $1 AND b.status IN ('unpaid', 'pending')
     ORDER BY u.blok_rumah, resident_name NULLS LAST`,
    [periodId],
  )

  return rows.map((r) => ({
    billing_id: r.billing_id,
    no_kk: r.kk_labels ?? '—',
    blok_rumah: r.blok_rumah,
    resident_name: r.resident_name ?? r.kk_labels ?? '—',
    total_amount: Number(r.total_amount),
    status: r.status,
  }))
}

export async function generateMonthlyBills(
  admin: AdminTenantContext,
  input: {
    year: number
    month: number
    housing_complex_id?: string | null
    due_date?: string
    line_items: LineItemInput[]
  },
) {
  const housingId = resolveHousingComplexId(admin, input.housing_complex_id ?? admin.housing_complex_id)
  await assertHousingExists(housingId)

  const items = input.line_items.filter((l) => l.item_name.trim() && l.amount > 0)
  if (!items.length) {
    throw new BadRequestError('Minimal satu rincian tagihan dengan nominal > 0')
  }

  const totalPerUnit = sumLines(items)
  const label = periodLabel(input.year, input.month)
  const dueDate =
    input.due_date ??
    new Date(input.year, input.month, 10).toISOString().slice(0, 10)

  const { rows: period } = await query<{ id: string }>(
    `INSERT INTO billing_periods (
       housing_complex_id, period_year, period_month, label, due_date, line_template
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     ON CONFLICT (housing_complex_id, period_year, period_month)
     DO UPDATE SET
       label = EXCLUDED.label,
       due_date = EXCLUDED.due_date,
       line_template = EXCLUDED.line_template
     RETURNING id`,
    [housingId, input.year, input.month, label, dueDate, JSON.stringify(items)],
  )

  const periodId = period[0]?.id
  if (!periodId) throw new BadRequestError('Gagal membuat periode')

  const units = await listBillableUnits(housingId, input.year, input.month)
  const activeUnits = await countActiveUnits(housingId)
  const bills_skipped = Math.max(0, activeUnits - units.length)

  let created = 0
  let updated = 0

  for (const u of units) {
    const { rows: refKk } = await query<{ no_kk: string }>(
      `SELECT no_kk FROM residents
       WHERE housing_unit_id = $1 AND is_parent = TRUE AND status = 'active' AND deleted_at IS NULL
       LIMIT 1`,
      [u.housing_unit_id],
    )
    const refNoKk =
      refKk[0]?.no_kk ??
      (
        await query<{ no_kk: string }>(
          `SELECT no_kk FROM residents
           WHERE housing_unit_id = $1 AND status = 'active' AND deleted_at IS NULL
           LIMIT 1`,
          [u.housing_unit_id],
        )
      ).rows[0]?.no_kk ??
      '0000000000000000'

    const { rows: existing } = await query<{ id: string; status: string }>(
      `SELECT id::text, status::text FROM billings
       WHERE housing_complex_id = $1 AND housing_unit_id = $2 AND period_id = $3`,
      [housingId, u.housing_unit_id, periodId],
    )

    let billId = existing[0]?.id

    if (!billId) {
      const { rows: inserted } = await query<{ id: string }>(
        `INSERT INTO billings (housing_complex_id, housing_unit_id, no_kk, period_id, total_amount, status)
         VALUES ($1, $2, $3, $4, $5, 'unpaid')
         RETURNING id::text`,
        [housingId, u.housing_unit_id, refNoKk, periodId, totalPerUnit],
      )
      billId = inserted[0]?.id
      if (billId) created++
    } else if (existing[0]?.status === 'unpaid') {
      await query(
        `UPDATE billings SET total_amount = $2, no_kk = $3, updated_at = NOW() WHERE id = $1`,
        [billId, totalPerUnit, refNoKk],
      )
      updated++
    }

    if (!billId) continue

    if (existing[0]?.status === 'paid' || existing[0]?.status === 'pending') {
      continue
    }

    await query(`DELETE FROM billing_line_items WHERE billing_id = $1`, [billId])
    let sort = 1
    for (const line of items) {
      await query(
        `INSERT INTO billing_line_items (billing_id, item_name, amount, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [billId, line.item_name.trim(), line.amount, sort++],
      )
    }
  }

  return {
    period_id: periodId,
    bills_created: created,
    bills_updated: updated,
    bills_skipped,
    billable_kk: units.length,
    total_per_kk: totalPerUnit,
    line_items: items,
  }
}

export async function createExpense(
  admin: AdminTenantContext,
  input: {
    housing_complex_id?: string | null
    period_year: number
    period_month: number
    title: string
    amount: number
    category?: string
    notes?: string
    spent_at?: string
  },
  adminId: string,
) {
  const housingId = resolveHousingComplexId(admin, input.housing_complex_id ?? admin.housing_complex_id)
  if (input.amount <= 0) throw new BadRequestError('Nominal pengeluaran harus > 0')

  const { rows } = await query<{ id: string }>(
    `INSERT INTO ipl_expenses (
       housing_complex_id, period_year, period_month, title, amount, category, notes, spent_at, created_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::date, CURRENT_DATE), $9)
     RETURNING id::text`,
    [
      housingId,
      input.period_year,
      input.period_month,
      input.title.trim(),
      input.amount,
      input.category?.trim() || 'Umum',
      input.notes?.trim() || null,
      input.spent_at ?? null,
      adminId,
    ],
  )
  return { id: rows[0]!.id }
}

export async function deleteExpense(admin: AdminTenantContext, id: string) {
  const { rows } = await query<{ housing_complex_id: string }>(
    `SELECT housing_complex_id::text FROM ipl_expenses WHERE id = $1`,
    [id],
  )
  if (!rows[0]) throw new NotFoundError('Pengeluaran tidak ditemukan')
  resolveHousingComplexId(admin, rows[0].housing_complex_id)
  await query(`DELETE FROM ipl_expenses WHERE id = $1`, [id])
  return { id }
}
