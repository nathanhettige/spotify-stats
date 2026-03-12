import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react"
import { currentUserQueryOptions } from "../api/me/me"
import type { ReactNode } from "react"
import type { SpotifyUser } from "@/lib/spotify/api/me/me"
import {
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
  const queryClient = useQueryClient()
  const hasToken = hasStoredToken()
  const { data: user, isLoading, isError } = useQuery({
    ...currentUserQueryOptions,
    enabled: hasToken,
  })

  const state: AuthState = useMemo(
    () => ({
      user: hasToken && !isError ? user ?? null : null,
      isLoading: hasToken && isLoading,
      isAuthenticated: hasToken && !!user && !isError,
    }),
    [hasToken, user, isLoading, isError],
  )

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: currentUserQueryOptions.queryKey,
    })
  }, [queryClient])

  const login = useCallback(async () => {
    await spotifyLogin()
  }, [])

  const logout = useCallback(() => {
    spotifyLogout()
    queryClient.removeQueries({ queryKey: currentUserQueryOptions.queryKey })
  }, [queryClient])

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
