import type { BillingStatus } from './user.model.js'

export type BillingPeriod = {
  period_id: string
  label: string
  period_year: number
  period_month: number
  due_date: string
}

export type BillingLineItem = {
  item_name: string
  amount: string
}

export type IplBillRecord = {
  id: string
  no_kk: string
  period_id: string
  total_amount: string
  status: BillingStatus
}
