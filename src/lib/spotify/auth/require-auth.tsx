"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "@tanstack/react-router"
import { useAuth } from "@/lib/spotify/auth/auth-context"

const CALLBACK_PATH = "/callback"

/**
 * When mounted, redirects to Spotify login if the user has no valid token.
 * Skip redirect when we're on the callback route (to allow OAuth callback to run).
 * After an intentional logout, shows a "logged out" UI instead of auto-redirecting.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth()
  const router = useRouter()
  const pathname = router.state.location.pathname
  const wasAuthenticated = useRef(false)

  // Track if we've ever been authenticated in this session
  if (isAuthenticated) {
    wasAuthenticated.current = true
  }

  useEffect(() => {
    if (pathname === CALLBACK_PATH) return
    if (isLoading) return
    if (isAuthenticated) return
    if (wasAuthenticated.current) return // Don't auto-redirect after intentional logout
    login()
  }, [pathname, isLoading, isAuthenticated, login])

  if (pathname === CALLBACK_PATH) return <>{children}</>

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        {wasAuthenticated.current ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground">You've been logged out.</p>
            <button
              onClick={login}
              className="rounded-full bg-[#1DB954] px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-[#1DB954]/90"
            >
              Log in with Spotify
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground">Redirecting to Spotify…</p>
        )}
      </div>
    )
  }

  return <>{children}</>
}
