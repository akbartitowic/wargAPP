import { query } from '../config/database.js'

export async function getHomeConfig(housingComplexId: string) {
  const { rows: items } = await query<{
    menu_key: string
    label: string
    icon: string
    route_path: string
    sort_order: number
  }>(
    `SELECT menu_key, label, icon, route_path, sort_order
     FROM home_menu_items
     WHERE housing_complex_id = $1 AND is_active = TRUE
     ORDER BY sort_order ASC`,
    [housingComplexId],
  )

  const topFour = items.slice(0, 4).map((m) => ({
    key: m.menu_key,
    label: m.label,
    icon: m.icon,
    route: m.route_path,
  }))

  return {
    server_time_iso: new Date().toISOString(),
    quick_menu: topFour,
  }
}
