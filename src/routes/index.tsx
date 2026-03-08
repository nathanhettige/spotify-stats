import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/lib/spotify/auth/auth-context"

export const Route = createFileRoute("/")({
  component: IndexPage,
})

function IndexPage() {
  return (
    <RequireAuth>
      <App />
    </RequireAuth>
  )
}

function App() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Spotify Stats</h1>
          <p className="mt-2 text-muted-foreground">
            You're signed in as{" "}
            <span className="font-medium text-foreground">
              {user?.display_name ?? user?.email ?? user?.id ?? "Spotify user"}
            </span>
          </p>
          {user?.images?.[0]?.url && (
            <img
              src={user.images[0].url}
              alt=""
              className="mt-2 size-12 rounded-full"
            />
          )}
          <Button className="mt-4" variant="outline" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
