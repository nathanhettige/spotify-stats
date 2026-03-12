/**
 * Current user profile endpoint.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
 */

import { queryOptions } from "@tanstack/react-query"
import { spotifyFetch } from "../index.api.ts"

export interface SpotifyUser {
  id: string
  display_name: string | null
  email?: string
  images: Array<{ url: string; height: number | null; width: number | null }>
  product?: string
  type: string
  uri: string
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
