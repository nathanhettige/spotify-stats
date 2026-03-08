/**
 * Spotify Web API helpers. Uses the access token from the auth flow.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
 */

import { queryOptions } from "@tanstack/react-query"
import { getAccessToken } from "./auth/oauth"

const SPOTIFY_API_BASE = "https://api.spotify.com/v1"

export interface SpotifyUser {
  id: string
  display_name: string | null
  email?: string
  images: Array<{ url: string; height: number | null; width: number | null }>
  product?: string
  type: string
  uri: string
}

async function spotifyFetch<T>(path: string): Promise<T> {
  const token = await getAccessToken()
  if (!token) throw new Error("Not authenticated")
  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Spotify API error: ${res.status} ${text}`)
  }
  return res.json() as Promise<T>
}

/** Get the current user's profile. */
export function getCurrentUser(): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>("/me")
}

/** TanStack Query options for the current user. Use with useQuery or useSuspenseQuery. */
export const currentUserQueryOptions = queryOptions({
  queryKey: ["spotify", "me"] as const,
  queryFn: getCurrentUser,
})
