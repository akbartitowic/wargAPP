import { useEffect, useId, useRef, useState } from 'react'
import { searchWilayah, type WilayahOption } from '@/api/wilayah'

type Props = {
  label: string
  parentKode?: string | null
  value: WilayahOption | null
  onChange: (item: WilayahOption | null) => void
  disabled?: boolean
  placeholder?: string
  required?: boolean
}

const LIMIT = 10
const DEBOUNCE_MS = 300

export function WilayahSearchCombobox({
  label,
  parentKode,
  value,
  onChange,
  disabled,
  placeholder = 'Ketik untuk mencari…',
  required,
}: Props) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<WilayahOption[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const parentBlocked = parentKode === undefined ? false : !parentKode

  useEffect(() => {
    if (!open || parentBlocked) {
      setItems([])
      return
    }

    const timer = window.setTimeout(() => {
      setLoading(true)
      setErr(null)
      void searchWilayah({ parent: parentKode ?? undefined, q: query, limit: LIMIT })
        .then(setItems)
        .catch((e) => setErr(e instanceof Error ? e.message : 'Gagal memuat'))
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [open, query, parentKode, parentBlocked])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const displayValue = open ? query : (value?.nama ?? '')

  return (
    <div ref={wrapRef} className="relative text-sm">
      <label className="block">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          disabled={disabled || parentBlocked}
          required={required}
          placeholder={parentBlocked ? 'Pilih tingkat di atas terlebih dahulu' : placeholder}
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => {
            setQuery(value?.nama ?? '')
            setOpen(true)
          }}
          className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 disabled:cursor-not-allowed disabled:bg-muted"
        />
      </label>

      {open && !parentBlocked ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md"
        >
          {loading ? (
            <li className="px-3 py-2 text-muted-foreground">Memuat…</li>
          ) : err ? (
            <li className="px-3 py-2 text-destructive">{err}</li>
          ) : items.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">
              {query ? 'Tidak ditemukan' : 'Ketik nama untuk mencari (maks. 10 hasil)'}
            </li>
          ) : (
            items.map((item) => (
              <li key={item.kode} role="option" aria-selected={value?.kode === item.kode}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(item)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  <span className="block font-medium">{item.nama}</span>
                  <span className="font-mono text-xs text-muted-foreground">{item.kode}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      <p className="mt-0.5 text-xs text-muted-foreground">Maks. {LIMIT} hasil — persempit dengan kata kunci.</p>
    </div>
  )
}
