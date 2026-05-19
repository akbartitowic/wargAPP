const KEY = 'cms-auth'

export type CmsSession = {
  access_token: string | null
  role: string | null
  housing_complex_id: string | null
  housing_name: string | null
  is_super_admin: boolean
}

const empty: CmsSession = {
  access_token: null,
  role: null,
  housing_complex_id: null,
  housing_name: null,
  is_super_admin: false,
}

function read(): CmsSession {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<CmsSession>
    return {
      access_token: parsed.access_token ?? null,
      role: parsed.role ?? null,
      housing_complex_id: parsed.housing_complex_id ?? null,
      housing_name: parsed.housing_name ?? null,
      is_super_admin: Boolean(parsed.is_super_admin),
    }
  } catch {
    return empty
  }
}

let cache = read()

export function getCmsSession(): CmsSession {
  return cache
}

export function setCmsSession(session: {
  access_token: string
  role: string
  housing_complex_id?: string | null
  housing_name?: string | null
  is_super_admin?: boolean
}): void {
  cache = {
    access_token: session.access_token,
    role: session.role,
    housing_complex_id: session.housing_complex_id ?? null,
    housing_name: session.housing_name ?? null,
    is_super_admin: Boolean(session.is_super_admin),
  }
  localStorage.setItem(KEY, JSON.stringify(cache))
}

export function clearCmsSession(): void {
  cache = empty
  localStorage.removeItem(KEY)
}
