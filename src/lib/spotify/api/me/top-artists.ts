/**
 * Current user's top artists endpoint.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
 */

import { queryOptions } from "@tanstack/react-query"
import { spotifyFetch } from "../index.api.ts"

export type TimeRange = "short_term" | "medium_term" | "long_term"

export interface SpotifyArtist {
  id: string
  name: string
  images: Array<{ url: string; height: number | null; width: number | null }>
  genres: Array<string>
  followers: { total: number }
  popularity: number
  external_urls: { spotify: string }
}

interface SpotifyTopArtistsResponse {
  items: Array<SpotifyArtist>
  total: number
  limit: number
  offset: number
  next: string | null
  previous: string | null
}

export function getTopArtists(
  timeRange: TimeRange = "medium_term",
  limit = 50,
  offset = 0,
): Promise<SpotifyTopArtistsResponse> {
  return spotifyFetch<SpotifyTopArtistsResponse>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}&offset=${offset}`,
  )
}

export const topArtistsQueryOptions = (timeRange: TimeRange = "medium_term") =>
  queryOptions({
    queryKey: ["spotify", "me", "top-artists", timeRange] as const,
    queryFn: () => getTopArtists(timeRange),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
