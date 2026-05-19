import { query } from '../config/database.js'
import type { BillingLineItem, BillingPeriod } from '../models/iplBill.model.js'

export const billingRepository = {
  findLatestPeriod(housingComplexId: string) {
    return query<BillingPeriod & { period_id: string }>(
      `SELECT bp.id AS period_id, bp.label, bp.period_year, bp.period_month, bp.due_date::text
       FROM billing_periods bp
       WHERE bp.housing_complex_id = $1
       ORDER BY bp.period_year DESC, bp.period_month DESC LIMIT 1`,
      [housingComplexId],
    )
  },

  findBillByUnitAndPeriod(
    housingComplexId: string,
    housingUnitId: string | null,
    periodId: string,
    noKk?: string,
  ) {
    if (housingUnitId) {
      return query<{ id: string; total_amount: string; status: string }>(
        `SELECT id, total_amount::text, status::text
         FROM billings
         WHERE housing_complex_id = $1 AND period_id = $3
           AND (housing_unit_id = $2 OR (housing_unit_id IS NULL AND no_kk = $4))`,
        [housingComplexId, housingUnitId, periodId, noKk ?? ''],
      )
    }
    if (!noKk) {
      return query<{ id: string; total_amount: string; status: string }>(
        `SELECT id, total_amount::text, status::text FROM billings WHERE FALSE`,
      )
    }
    return query<{ id: string; total_amount: string; status: string }>(
      `SELECT id, total_amount::text, status::text
       FROM billings
       WHERE housing_complex_id = $1 AND period_id = $2 AND no_kk = $3`,
      [housingComplexId, periodId, noKk],
    )
  },

  findLatestBillingForUnit(
    housingComplexId: string,
    housingUnitId: string | null,
    noKk?: string,
  ) {
    if (housingUnitId) {
      return query<{
        id: string
        total_amount: string
        status: string
        period_id: string
        label: string
        period_year: number
        period_month: number
        due_date: string
      }>(
        `SELECT b.id, b.total_amount::text, b.status::text, bp.id AS period_id,
                bp.label, bp.period_year, bp.period_month, bp.due_date::text
         FROM billings b
         JOIN billing_periods bp ON bp.id = b.period_id
         WHERE b.housing_complex_id = $1
           AND (b.housing_unit_id = $2 OR (b.housing_unit_id IS NULL AND b.no_kk = $3))
         ORDER BY bp.period_year DESC, bp.period_month DESC
         LIMIT 1`,
        [housingComplexId, housingUnitId, noKk ?? ''],
      )
    }
    if (!noKk) {
      return query<{
        id: string
        total_amount: string
        status: string
        period_id: string
        label: string
        period_year: number
        period_month: number
        due_date: string
      }>(
        `SELECT b.id, b.total_amount::text, b.status::text, bp.id AS period_id,
                bp.label, bp.period_year, bp.period_month, bp.due_date::text
         FROM billings b
         JOIN billing_periods bp ON bp.id = b.period_id
         WHERE FALSE`,
      )
    }
    return query<{
      id: string
      total_amount: string
      status: string
      period_id: string
      label: string
      period_year: number
      period_month: number
      due_date: string
    }>(
      `SELECT b.id, b.total_amount::text, b.status::text, bp.id AS period_id,
              bp.label, bp.period_year, bp.period_month, bp.due_date::text
       FROM billings b
       JOIN billing_periods bp ON bp.id = b.period_id
       WHERE b.housing_complex_id = $1 AND b.no_kk = $2
       ORDER BY bp.period_year DESC, bp.period_month DESC
       LIMIT 1`,
      [housingComplexId, noKk],
    )
  },

  findLineItems(billingId: string) {
    return query<BillingLineItem>(
      `SELECT item_name, amount::text FROM billing_line_items
       WHERE billing_id = $1 ORDER BY sort_order`,
      [billingId],
    )
  },

  findHistoryByUnit(housingComplexId: string, housingUnitId: string, limit = 6) {
    return query<{
      billing_id: string
      label: string
      period_year: number
      period_month: number
      total_amount: string
      status: string
    }>(
      `SELECT b.id AS billing_id, bp.label, bp.period_year, bp.period_month,
              b.total_amount::text, b.status::text
       FROM billings b
       JOIN billing_periods bp ON bp.id = b.period_id
       WHERE b.housing_complex_id = $1 AND b.housing_unit_id = $2
       ORDER BY bp.period_year DESC, bp.period_month DESC
       LIMIT $3`,
      [housingComplexId, housingUnitId, limit],
    )
  },

  findBillForUnit(
    housingComplexId: string,
    billingId: string,
    housingUnitId: string | null,
    noKk?: string,
  ) {
    if (housingUnitId) {
      return query<{ id: string }>(
        `SELECT id FROM billings
         WHERE id = $1 AND housing_complex_id = $2
           AND (housing_unit_id = $3 OR (housing_unit_id IS NULL AND no_kk = $4))`,
        [billingId, housingComplexId, housingUnitId, noKk ?? ''],
      )
    }
    return query<{ id: string }>(
      `SELECT id FROM billings
       WHERE id = $1 AND housing_complex_id = $2 AND no_kk = $3`,
      [billingId, housingComplexId, noKk ?? ''],
    )
  },

  insertPaymentProof(
    billingId: string,
    residentId: string,
    file: { path: string; mimetype: string; size: number },
  ) {
    return query<{ id: string }>(
      `INSERT INTO payment_proofs (billing_id, resident_id, file_path, mime_type, file_size)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [billingId, residentId, file.path, file.mimetype, file.size],
    )
  },

  setBillingPending(billingId: string) {
    return query(`UPDATE billings SET status = 'pending', updated_at = NOW() WHERE id = $1`, [
      billingId,
    ])
  },
}
