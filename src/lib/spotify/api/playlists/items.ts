/**
 * Playlist items endpoint – Get Playlist Items.
 * @see https://developer.spotify.com/documentation/web-api/reference/get-playlists-items
 */

import { spotifyFetch } from "../index.api.ts"

export interface SpotifyArtistSimplified {
  id: string
  name: string
  uri: string
  external_urls: { spotify: string }
}

export interface SpotifyAlbumSimplified {
  id: string
  name: string
  uri: string
  images: Array<{ url: string; height: number | null; width: number | null }>
  external_urls: { spotify: string }
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  artists: Array<SpotifyArtistSimplified>
  album: SpotifyAlbumSimplified
  external_urls: { spotify: string }
}

export interface SpotifyEpisode {
  id: string
  name: string
  uri: string
  description: string
  external_urls: { spotify: string }
}

export interface PlaylistTrackObject {
  added_at: string | null
  added_by: {
    id: string
    type: string
    uri: string
    external_urls: { spotify: string }
  } | null
  is_local: boolean
  track: SpotifyTrack | SpotifyEpisode | null
}

export interface PlaylistItemsResponse {
  href: string
  limit: number
  next: string | null
  offset: number
  previous: string | null
  total: number
  items: Array<PlaylistTrackObject>
}

/** Fetch a single page of playlist items. */
export function getPlaylistItems(
  playlistId: string,
  limit = 50,
  offset = 0,
): Promise<PlaylistItemsResponse> {
  const fields = encodeURIComponent(
    "next,total,offset,items(added_at,added_by.id,track(id,name,type,artists(id,name,external_urls),album(id,name,images),external_urls))",
  )
  return spotifyFetch<PlaylistItemsResponse>(
    `/playlists/${playlistId}/items?limit=${limit}&offset=${offset}&fields=${fields}`,
  )
}
