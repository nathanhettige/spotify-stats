/**
 * Current user's playlists endpoint.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists
 */

import { queryOptions } from "@tanstack/react-query"
import { spotifyFetch } from  "../index.api.ts"

export interface SpotifyPlaylistSimplified {
  id: string
  name: string
  description: string | null
  collaborative: boolean
  public: boolean | null
  href: string
  uri: string
  images: Array<{ url: string; height: number | null; width: number | null }>
  owner: { id: string; display_name: string | null; type: string; uri: string }
  tracks: { href: string; total: number }
  external_urls: { spotify: string }
}

export interface SpotifyUserPlaylistsResponse {
  href: string
  limit: number
  next: string | null
  offset: number
  previous: string | null
  total: number
  items: Array<SpotifyPlaylistSimplified>
}

/** Get the current user's playlists (first page). */
export function getCurrentUserPlaylists(
  limit = 50,
  offset = 0,
): Promise<SpotifyUserPlaylistsResponse> {
  return spotifyFetch<SpotifyUserPlaylistsResponse>(
    `/me/playlists?limit=${limit}&offset=${offset}`,
  )
}

/** TanStack Query options for the current user's playlists. */
export const currentUserPlaylistsQueryOptions = (limit = 50, offset = 0) =>
  queryOptions({
    queryKey: ["spotify", "me", "playlists", limit, offset] as const,
    queryFn: () => getCurrentUserPlaylists(limit, offset),
  })
