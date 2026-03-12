/**
 * Shared Spotify API helpers. Uses the access token from the auth flow.
 */

import { getAccessToken } from "../auth/oauth"

export const SPOTIFY_API_BASE = "https://api.spotify.com/v1"

export async function spotifyFetch<T>(path: string): Promise<T> {
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