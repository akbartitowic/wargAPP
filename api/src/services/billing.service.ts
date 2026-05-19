import { billingRepository } from '../repositories/billing.repository.js'
import { NotFoundError } from '../utils/errors.js'

export async function getCurrentBilling(
  housingComplexId: string,
  housingUnitId: string | null,
  noKk: string,
) {
  const { rows: periodRows } = await billingRepository.findLatestPeriod(housingComplexId)
  const latestPeriod = periodRows[0]
  if (!latestPeriod) throw new NotFoundError('Periode tagihan belum dikonfigurasi')

  let bill =
    (
      await billingRepository.findBillByUnitAndPeriod(
        housingComplexId,
        housingUnitId,
        latestPeriod.period_id,
        noKk,
      )
    ).rows[0] ?? null

  let period = latestPeriod

  if (!bill) {
    const { rows: fallbackRows } = await billingRepository.findLatestBillingForUnit(
      housingComplexId,
      housingUnitId,
      noKk,
    )
    const fallback = fallbackRows[0]
    if (fallback) {
      bill = {
        id: fallback.id,
        total_amount: fallback.total_amount,
        status: fallback.status,
      }
      period = {
        period_id: fallback.period_id,
        label: fallback.label,
        period_year: fallback.period_year,
        period_month: fallback.period_month,
        due_date: fallback.due_date,
      }
    }
  }

  if (!bill) {
    return {
      period: {
        label: latestPeriod.label,
        year: latestPeriod.period_year,
        month: latestPeriod.period_month,
        due_date: latestPeriod.due_date,
      },
      status: 'unpaid' as const,
      total_amount: 0,
      line_items: [],
      message:
        'Belum ada tagihan untuk alamat Anda pada periode ini. Minta pengurus generate tagihan di CMS.',
    }
  }

  const { rows: lines } = await billingRepository.findLineItems(bill.id)
  return {
    period: {
      label: period.label,
      year: period.period_year,
      month: period.period_month,
      due_date: period.due_date,
    },
    billing_id: bill.id,
    status: bill.status,
    total_amount: Number(bill.total_amount),
    line_items: lines.map((l) => ({ name: l.item_name, amount: Number(l.amount) })),
  }
}

export async function getBillingHistory(
  housingComplexId: string,
  housingUnitId: string | null,
) {
  if (!housingUnitId) return []
  const { rows } = await billingRepository.findHistoryByUnit(housingComplexId, housingUnitId)
  return rows.map((r) => ({
    billing_id: r.billing_id,
    label: r.label,
    year: r.period_year,
    month: r.period_month,
    total_amount: Number(r.total_amount),
    status: r.status,
  }))
}

export async function savePaymentProof(
  housingComplexId: string,
  residentId: string,
  housingUnitId: string | null,
  noKk: string,
  billingId: string,
  file: { path: string; mimetype: string; size: number },
) {
  const { rows } = await billingRepository.findBillForUnit(
    housingComplexId,
    billingId,
    housingUnitId,
    noKk,
  )
  if (!rows[0]) throw new NotFoundError('Tagihan tidak ditemukan')

  const { rows: proof } = await billingRepository.insertPaymentProof(
    billingId,
    residentId,
    file,
  )
  await billingRepository.setBillingPending(billingId)
  return { proof_id: proof[0]?.id, status: 'pending' as const }
}
