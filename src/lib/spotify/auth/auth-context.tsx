import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react"
import type {ReactNode} from "react";
import type {SpotifyUser} from "@/lib/spotify/api";
import {  getCurrentUser } from "@/lib/spotify/api"
import {
  getAccessToken,
  hasStoredToken,
  login as spotifyLogin,
  logout as spotifyLogout,
} from "@/lib/spotify/auth/oauth"

interface AuthState {
  user: SpotifyUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: () => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const refreshUser = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false })
      return
    }
    try {
      const user = await getCurrentUser()
      setState({ user, isLoading: false, isAuthenticated: true })
    } catch {
      setState({ user: null, isLoading: false, isAuthenticated: false })
    }
  }, [])

  useEffect(() => {
    if (!hasStoredToken()) {
      setState((s) => ({ ...s, isLoading: false }))
      return
    }
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async () => {
    await spotifyLogin()
  }, [])

  const logout = useCallback(() => {
    spotifyLogout()
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
