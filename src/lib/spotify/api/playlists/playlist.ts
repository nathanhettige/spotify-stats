/**
 * Single playlist endpoint.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-playlist
 */

import { queryOptions } from "@tanstack/react-query"
import { spotifyFetch } from "../index.api.ts"

interface PlaylistDetails {
  followers: { total: number }
}

/** Fetch a playlist's details (followers count). */
function fetchPlaylistDetails(
  playlistId: string,
): Promise<PlaylistDetails> {
  const fields = encodeURIComponent("followers(total)")
  return spotifyFetch<PlaylistDetails>(
    `/playlists/${playlistId}?fields=${fields}`,
  )
}

/** TanStack Query options for a playlist's details. */
export const playlistDetailsQueryOptions = (playlistId: string) =>
  queryOptions({
    queryKey: ["spotify", "playlists", playlistId, "details"] as const,
    queryFn: () => fetchPlaylistDetails(playlistId),
    staleTime: 5 * 60 * 1000,
    enabled: !!playlistId,
  })
