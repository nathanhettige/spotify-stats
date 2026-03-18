/**
 * Current user's top tracks endpoint.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
 */

import { queryOptions } from "@tanstack/react-query"
import { spotifyFetch } from "../index.api.ts"
import type { TimeRange } from "./top-artists.ts"

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number | null; width: number | null }>
  }
  duration_ms: number
  external_urls: { spotify: string }
}

interface SpotifyTopTracksResponse {
  items: Array<SpotifyTrack>
  total: number
  limit: number
  offset: number
  next: string | null
  previous: string | null
}

function getTopTracks(
  timeRange: TimeRange = "medium_term",
  limit = 50,
  offset = 0,
): Promise<SpotifyTopTracksResponse> {
  return spotifyFetch<SpotifyTopTracksResponse>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}&offset=${offset}`,
  )
}

export const topTracksQueryOptions = (timeRange: TimeRange = "medium_term") =>
  queryOptions({
    queryKey: ["spotify", "me", "top-tracks", timeRange] as const,
    queryFn: () => getTopTracks(timeRange),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
