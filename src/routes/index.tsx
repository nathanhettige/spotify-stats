import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import type { SpotifyPlaylistSimplified } from "@/lib/spotify/api/me/playlists"
import { Button } from "@/components/ui/button"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/lib/spotify/auth/auth-context"
import { currentUserPlaylistsQueryOptions } from "@/lib/spotify/api/me/playlists"
import ContributionGraph from "@/components/ui/contribution-graph"

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
  const { data: playlistsData, isLoading, isError, error } = useQuery(
    currentUserPlaylistsQueryOptions(50, 0),
  )

  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <section className="w-full max-w-4xl">
        <ContributionGraph />
      </section>
      <div className="flex flex-col gap-4 text-sm leading-loose">
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

        <section className="border-t border-border pt-4">
          <h2 className="font-medium">Your playlists</h2>
          {isLoading && (
            <p className="mt-2 text-muted-foreground">Loading playlists…</p>
          )}
          {isError && (
            <p className="mt-2 text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to load playlists"}
            </p>
          )}
          {playlistsData?.items && (
            <ul className="mt-2 list-none space-y-2 p-0">
              {playlistsData.items.map((playlist) => (
                <PlaylistItem key={playlist.id} playlist={playlist} />
              ))}
            </ul>
          )}
          {playlistsData && playlistsData.total === 0 && (
            <p className="mt-2 text-muted-foreground">No playlists yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function PlaylistItem({ playlist }: { playlist: SpotifyPlaylistSimplified }) {
  const image = playlist.images?.[0]
  return (
    <li className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
      {image?.url ? (
        <img
          src={image.url}
          alt=""
          className="size-10 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
          —
        </div>
      )}
      <div className="min-w-0 flex-1">
        <a
          href={playlist.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
        >
          {playlist.name}
        </a>
        <p className="truncate text-xs text-muted-foreground">
          {playlist.tracks.total} tracks
          {playlist.description ? ` · ${playlist.description}` : ""}
        </p>
      </div>
    </li>
  )
}
