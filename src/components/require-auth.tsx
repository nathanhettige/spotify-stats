"use client"

import { useEffect } from "react"
import { useRouter } from "@tanstack/react-router"
import { useAuth } from "@/lib/spotify/auth/auth-context"

const CALLBACK_PATH = "/callback"

/**
 * When mounted, redirects to Spotify login if the user has no valid token.
 * Skip redirect when we're on the callback route (to allow OAuth callback to run).
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth()
  const router = useRouter()
  const pathname = router.state.location.pathname

  useEffect(() => {
    if (pathname === CALLBACK_PATH) return
    if (isLoading) return
    if (isAuthenticated) return
    login()
  }, [pathname, isLoading, isAuthenticated, login])

  if (pathname === CALLBACK_PATH) return <>{children}</>
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-muted-foreground">Redirecting to Spotify…</p>
      </div>
    )
  }
  return <>{children}</>
}
