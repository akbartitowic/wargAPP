const KEY = 'warga-news-read-slugs'

function readSet(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x) => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

export function isNewsRead(slug: string): boolean {
  return readSet().has(slug)
}

export function markNewsRead(slug: string): void {
  try {
    const s = readSet()
    s.add(slug)
    localStorage.setItem(KEY, JSON.stringify([...s]))
  } catch {
    /* ignore */
  }
}
