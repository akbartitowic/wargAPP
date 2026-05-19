import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`

export function UmkmSubNav() {
  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1" aria-label="Menu UMKM">
      <NavLink to="/umkm/toko" className={linkClass}>
        Daftar toko
      </NavLink>
      <NavLink to="/umkm/persetujuan" className={linkClass}>
        Persetujuan mitra
      </NavLink>
      <NavLink to="/umkm/perubahan" className={linkClass}>
        Perubahan toko
      </NavLink>
    </nav>
  )
}
