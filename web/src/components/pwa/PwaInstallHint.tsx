import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const STORAGE_KEY = 'warga-pwa-install-dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  )
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function PwaInstallHint() {
  const standalone = useMemo(() => isStandalone(), [])
  const [dismissed, setDismissed] = useState(() => readDismissed())

  if (standalone || dismissed) return null

  return (
    <Card className="border-royal/20 bg-royal text-beige">
      <p className="text-sm font-medium leading-relaxed">
        Tambahkan ke layar utama untuk akses cepat info warga.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="!border-beige !text-beige hover:!bg-beige/10"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, '1')
            } catch {
              /* ignore */
            }
            setDismissed(true)
          }}
        >
          Tutup
        </Button>
      </div>
    </Card>
  )
}
