import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { exchangeCodeForTokens } from "@/lib/spotify/auth/oauth"

export const Route = createFileRoute("/callback")({
  component: CallbackPage,
  validateSearch: (search: Record<string, unknown>) => ({
    code: search.code as string,
    state: search.state as string,
    error: search.error as string,
  }),
})

function CallbackPage() {
  const navigate = useNavigate()
  const { code, state, error } = Route.useSearch()
  const [message, setMessage] = useState("Completing sign in…")

  useEffect(() => {
    if (error) {
      setMessage(`Sign in failed: ${error}`)
      return
    }
    if (!code || !state) {
      setMessage("Missing code or state. Please try signing in again.")
      return
    }
    exchangeCodeForTokens(code, state)
      .then(() => {
        navigate({ to: "/" })
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : "Sign in failed")
      })
  }, [code, state, error, navigate])

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
