import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

/** Web: tab baru. Native: in-app browser (Chrome Custom Tabs / SFSafariViewController). */
export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
