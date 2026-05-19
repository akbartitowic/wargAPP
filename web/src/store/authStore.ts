import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
  access_token: string | null
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access_token: null,
      setToken: (access_token) => set({ access_token }),
      logout: () => {
        set({ access_token: null })
        try {
          localStorage.removeItem('warga-auth')
        } catch {
          /* ignore */
        }
      },
    }),
    { name: 'warga-auth', partialize: (s) => ({ access_token: s.access_token }) },
  ),
)

export function getAccessToken(): string | null {
  return useAuthStore.getState().access_token
}
