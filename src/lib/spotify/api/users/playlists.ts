/**
 * A specific user's playlists endpoint.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-list-users-playlists
 */

import { queryOptions } from "@tanstack/react-query"
import { spotifyFetch } from "../index.api.ts"
import type { SpotifyUserPlaylistsResponse } from "../me/playlists.ts"

/** Get playlists owned or followed by the given user. */
export function getUserPlaylists(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<SpotifyUserPlaylistsResponse> {
  return spotifyFetch<SpotifyUserPlaylistsResponse>(
    `/users/${encodeURIComponent(userId)}/playlists?limit=${limit}&offset=${offset}`,
  )
}

/** TanStack Query options for a specific user's playlists. */
export const userPlaylistsQueryOptions = (
  userId: string,
  limit = 50,
  offset = 0,
) =>
  queryOptions({
    queryKey: ["spotify", "users", userId, "playlists", limit, offset] as const,
    queryFn: () => getUserPlaylists(userId, limit, offset),
    enabled: !!userId,
  })

