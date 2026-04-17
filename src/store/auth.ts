import { create } from 'zustand'
import { fetcher } from '../lib/api'

interface User {
  id: string
  username: string
  role: string
  profile?: any
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token, isLoading: false })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isLoading: false })
  },
  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        set({ isLoading: false })
        return
      }
      const user = await fetcher('/auth/me')
      set({ user, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isLoading: false })
    }
  }
}))
