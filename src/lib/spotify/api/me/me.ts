/**
 * Current user profile endpoint.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
 */

import { queryOptions } from "@tanstack/react-query"
import { spotifyFetch } from "../index.api.ts"

export interface SpotifyUser {
  country: string
  display_name: string
  email: string
  explicit_content: {
    filter_enabled: boolean
    filter_locked: boolean
  }
  external_urls: {
    spotify: string
    [key: string]: string
  }
  followers: {
    href: string | null
    total: number
  }
  href: string
  id: string
  images: Array<{
    height: number | null
    url: string
    width: number | null
  }>
  product: string
  type: string
  uri: string
}

/** Get the current user's profile. */
export function getCurrentUser(): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>("/me")
}

/** TanStack Query options for the current user. Use with useQuery or useSuspenseQuery. */
export const meQueryOptions = queryOptions({
  queryKey: ["spotify", "me"] as const,
  queryFn: getCurrentUser,
})

export default meQueryOptions