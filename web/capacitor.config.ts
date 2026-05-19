import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.warga.app',
  appName: 'Warga App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
