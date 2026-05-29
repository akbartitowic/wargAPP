import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type BottomDrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function BottomDrawer({ open, onClose, title, children }: BottomDrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-lg" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Tutup menu"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-drawer-title"
        className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-b-0 border-royal/15 bg-surface shadow-[0_-8px_32px_rgba(0,35,102,0.18)]"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-royal/10 px-4 py-3">
          <h2 id="bottom-drawer-title" className="text-base font-bold text-royal">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-royal/70 transition hover:bg-royal/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal/30"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="max-h-[min(70dvh,420px)] overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  )
}
