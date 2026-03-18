/**
 * Playlist service – fetches all playlists owned by a user, enriched with follower counts.
 */

import { queryOptions } from "@tanstack/react-query"
import { userPlaylistsQueryOptions } from "../api/users/playlists.ts"
import { playlistDetailsQueryOptions } from "../api/playlists/playlist.ts"
import type { SpotifyPlaylistSimplified } from "../api/me/playlists.ts"
import { getContext } from "@/integrations/tanstack-query/root-provider"

export interface EnrichedPlaylist extends SpotifyPlaylistSimplified {
  followers: number
}

async function fetchAllPlaylists(userId: string): Promise<Array<SpotifyPlaylistSimplified>> {
  const { queryClient } = getContext()
  const playlists: Array<SpotifyPlaylistSimplified> = []
  let offset = 0
  const limit = 50
  let hasMore = true

  while (hasMore) {
    const page = await queryClient.fetchQuery(userPlaylistsQueryOptions(userId, limit, offset))
    playlists.push(...page.items)
    hasMore = page.next !== null && playlists.length < page.total
    if (hasMore) offset += limit
  }

  return playlists
}

export async function getOwnedPlaylists(userId: string): Promise<Array<EnrichedPlaylist>> {
  const { queryClient } = getContext()
  const all = await fetchAllPlaylists(userId)
  const owned = all.filter((p) => p.owner.id === userId)

  const results = await Promise.allSettled(
    owned.map(async (playlist) => {
      let followers = 0
      try {
        const details = await queryClient.fetchQuery(playlistDetailsQueryOptions(playlist.id))
        followers = details.followers.total
      } catch {
        // Keep followers as 0 if the call fails
      }
      return { ...playlist, followers }
    }),
  )

  return results
    .filter((r): r is PromiseFulfilledResult<EnrichedPlaylist> => r.status === "fulfilled")
    .map((r) => r.value)
}

export const ownedPlaylistsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["spotify", "playlists", "owned", userId] as const,
    queryFn: () => getOwnedPlaylists(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!userId,
  })
