import type { Request } from 'express'
import { query } from '../config/database.js'

export type AuditAction =
  | 'admin.login'
  | 'admin.password.change'
  | 'admin.user.create'
  | 'admin.user.update'
  | 'admin.user.deactivate'
  | 'admin.user.reset_password'
  | 'admin.user.account_status'
  | 'admin.billing.generate'
  | 'admin.billing.approve'
  | 'admin.billing.reject'
  | 'admin.news.publish'
  | 'admin.news.update'
  | 'admin.news.upload_hero'
  | 'admin.housing.create'
  | 'admin.housing.update'
  | 'admin.housing.deactivate'
  | 'admin.admin.create'
  | 'admin.admin.update'

export async function writeAuditLog(input: {
  actorType: 'admin' | 'resident'
  actorId: string
  action: AuditAction | string
  entityType?: string
  entityId?: string
  payload?: unknown
  req?: Request
}): Promise<void> {
  const ip =
    (input.req?.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    input.req?.socket.remoteAddress ??
    null

  await query(
    `INSERT INTO audit_logs (actor_type, actor_id, action, entity_type, entity_id, payload, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::inet)`,
    [
      input.actorType,
      input.actorId,
      input.action,
      input.entityType ?? null,
      input.entityId ?? null,
      input.payload != null ? JSON.stringify(input.payload) : null,
      ip,
    ],
  )
}

export async function listAuditLogs(limit = 50, offset = 0) {
  const { rows } = await query<{
    id: string
    actor_type: string
    actor_id: string
    action: string
    entity_type: string | null
    entity_id: string | null
    payload: unknown
    created_at: Date
  }>(
    `SELECT id::text, actor_type, actor_id::text, action, entity_type, entity_id::text,
            payload, created_at
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  )

  return rows.map((r) => ({
    id: r.id,
    actor_type: r.actor_type,
    actor_id: r.actor_id,
    action: r.action,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    payload: r.payload,
    created_at: r.created_at.toISOString(),
  }))
}
