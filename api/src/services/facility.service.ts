import { query } from '../config/database.js'
import { computeShopOpenStatus } from './umkmHours.service.js'
import { NotFoundError } from '../utils/errors.js'

type FacilityRow = {
  id: string
  name: string
  facility_type: string
  description: string | null
  image_url: string | null
  address: string | null
  latitude: number
  longitude: number
  open_time: string | null
  close_time: string | null
}

function mapFacility(row: FacilityRow) {
  const open =
    row.open_time && row.close_time
      ? computeShopOpenStatus(row.open_time, row.close_time)
      : { is_open: true, label: 'Informasi jam tidak tersedia' }

  return {
    id: row.id,
    name: row.name,
    facility_type: row.facility_type,
    description: row.description,
    image_url: row.image_url,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    open_time: row.open_time?.slice(0, 5) ?? null,
    close_time: row.close_time?.slice(0, 5) ?? null,
    is_open: open.is_open,
    open_status_label: open.label,
    maps_url: `https://www.google.com/maps?q=${row.latitude},${row.longitude}`,
    directions_url: `https://www.google.com/maps/dir/?api=1&destination=${row.latitude},${row.longitude}`,
  }
}

export async function listFacilities(housingComplexId: string) {
  const { rows } = await query<FacilityRow>(
    `SELECT id::text, name, facility_type, description, image_url, address,
            latitude, longitude,
            open_time::text, close_time::text
     FROM public_facilities
     WHERE housing_complex_id = $1 AND is_active = TRUE
     ORDER BY sort_order, name`,
    [housingComplexId],
  )
  return rows.map(mapFacility)
}

export async function getFacilityById(housingComplexId: string, facilityId: string) {
  const { rows } = await query<FacilityRow>(
    `SELECT id::text, name, facility_type, description, image_url, address,
            latitude, longitude,
            open_time::text, close_time::text
     FROM public_facilities
     WHERE id = $1 AND housing_complex_id = $2 AND is_active = TRUE`,
    [facilityId, housingComplexId],
  )
  if (!rows[0]) throw new NotFoundError('Fasilitas tidak ditemukan')
  return mapFacility(rows[0])
}
