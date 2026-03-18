import { useQuery } from "@tanstack/react-query"
import { Music2, Pin, Users } from "lucide-react"
import type {EnrichedPlaylist} from "@/lib/spotify/services/playlist-service";
import {  ownedPlaylistsQueryOptions } from "@/lib/spotify/services/playlist-service"

const PINNED_KEY = "spotify-pinned-playlists"

function getPinnedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PINNED_KEY)
    return new Set(raw ? (JSON.parse(raw) as Array<string>) : [])
  } catch {
    return new Set()
  }
}

interface PlaylistsTabProps {
  userId: string
}

export function PlaylistsTab({ userId }: PlaylistsTabProps) {
  const { data: playlists, isLoading, error } = useQuery(
    ownedPlaylistsQueryOptions(userId),
  )

  const pinnedIds = getPinnedIds()

  const sorted = [...(playlists ?? [])].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id) ? 1 : 0
    const bPinned = pinnedIds.has(b.id) ? 1 : 0
    if (bPinned !== aPinned) return bPinned - aPinned
    if (b.followers !== a.followers) return b.followers - a.followers
    return b.tracks.total - a.tracks.total
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading playlists...
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Failed to load playlists.
      </div>
    )
  }

  if (!sorted.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No playlists found.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {sorted.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          isPinned={pinnedIds.has(playlist.id)}
        />
      ))}
    </div>
  )
}

interface PlaylistCardProps {
  playlist: EnrichedPlaylist
  isPinned: boolean
}

function PlaylistCard({ playlist, isPinned }: PlaylistCardProps) {
  const imageUrl = playlist.images[0]?.url

  return (
    <a
      href={playlist.external_urls.spotify}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-muted/40"
    >
      <div className="aspect-square w-full overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={playlist.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Music2 className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold">{playlist.name}</span>
          {isPinned && (
            <Pin className="h-3.5 w-3.5 shrink-0 fill-current text-green-400" />
          )}
        </div>
        {playlist.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{playlist.description}</p>
        )}
        <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          {playlist.followers > 0 && (
            <>
              <Users className="h-3 w-3" />
              <span>{playlist.followers.toLocaleString()}</span>
              <span>·</span>
            </>
          )}
          <span>{playlist.tracks.total.toLocaleString()} tracks</span>
        </div>
      </div>
    </a>
  )
}
