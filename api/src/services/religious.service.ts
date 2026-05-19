import { query } from '../config/database.js'

async function residentAgama(residentId: string): Promise<string | null> {
  const { rows } = await query<{ agama: string }>(
    `SELECT agama::text FROM residents WHERE id = $1 AND status = 'active' AND deleted_at IS NULL`,
    [residentId],
  )
  return rows[0]?.agama ?? null
}

function religionFilterSql(alias: string, paramIndex: number): string {
  return ` AND (cardinality(${alias}.religions) = 0 OR $${paramIndex}::religion_type = ANY(${alias}.religions))`
}

export async function getSchedule(
  housingComplexId: string,
  residentId: string,
  type?: string,
) {
  const agama = await residentAgama(residentId)

  let sql = `
    SELECT ws.id, ws.schedule_type::text, ws.label, ws.event_time::text,
           ws.day_of_week, wp.name AS place_name, wp.address,
           wp.latitude, wp.longitude
    FROM worship_schedules ws
    JOIN worship_places wp ON wp.id = ws.place_id
    WHERE wp.housing_complex_id = $1 AND ws.is_active = TRUE AND wp.is_active = TRUE`
  const params: unknown[] = [housingComplexId]

  if (agama) {
    params.push(agama)
    sql += religionFilterSql('wp', params.length)
    sql += religionFilterSql('ws', params.length)
  }

  if (type) {
    params.push(type)
    sql += ` AND ws.schedule_type::text = $${params.length}`
  }

  sql += ' ORDER BY wp.name, ws.event_time'

  const { rows } = await query<{
    id: string
    schedule_type: string
    label: string
    event_time: string
    day_of_week: number | null
    place_name: string
    address: string | null
    latitude: number
    longitude: number
  }>(sql, params)

  return rows.map((r) => ({
    id: r.id,
    type: r.schedule_type,
    label: r.label,
    time: r.event_time.slice(0, 5),
    day_of_week: r.day_of_week,
    place_name: r.place_name,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
  }))
}

export async function listPlaces(housingComplexId: string, residentId: string) {
  const agama = await residentAgama(residentId)

  let sql = `
    SELECT id, name, place_type, address, latitude, longitude
    FROM worship_places
    WHERE housing_complex_id = $1 AND is_active = TRUE`
  const params: unknown[] = [housingComplexId]

  if (agama) {
    params.push(agama)
    sql += religionFilterSql('worship_places', params.length)
  }

  sql += ' ORDER BY name'

  const { rows } = await query<{
    id: string
    name: string
    place_type: string
    address: string | null
    latitude: number
    longitude: number
  }>(sql, params)

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.place_type,
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    maps_url: `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`,
  }))
}
