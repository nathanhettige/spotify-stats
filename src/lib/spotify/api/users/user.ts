/**
 * Public user profile by ID.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-users-profile
 */

import { queryOptions } from "@tanstack/react-query"
import { spotifyFetch } from "../index.api.ts"

export interface SpotifyPublicUser {
  display_name: string | null
  external_urls: {
    spotify: string
    [key: string]: string
  }
  followers: {
    href: null
    total: number
  }
  href: string
  id: string
  images: Array<{
    height: number | null
    url: string
    width: number | null
  }>
  type: string
  uri: string
}

/** Get a user's public profile by ID. */
export function getUser(userId: string): Promise<SpotifyPublicUser> {
  return spotifyFetch<SpotifyPublicUser>(
    `/users/${encodeURIComponent(userId)}`,
  )
}

/** TanStack Query options for a user's public profile. */
export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["spotify", "users", userId] as const,
    queryFn: () => getUser(userId),
    enabled: !!userId,
  })
