/**
 * Contribution service – aggregates "tracks added to playlists" into a
 * GitHub-style heatmap dataset and a per-day detail list.
 */

import { getPlaylistItems } from "../api/playlists/items.ts"
import { userPlaylistsQueryOptions } from "../api/users/playlists.ts"
import { getContext } from "@/integrations/tanstack-query/root-provider"

interface ContributionData {
  date: string
  count: number
  level: number
}

export interface ContributionEntry {
  /** ISO date-time string from added_at */
  addedAt: string
  trackId: string
  trackName: string
  trackUrl: string
  artistNames: string
  albumName: string
  albumImageUrl: string | null
  playlistId: string
  playlistName: string
  playlistUrl: string
}

export interface ContributionResult {
  /** Array suitable for passing directly to ContributionGraph's data prop */
  heatmapData: Array<ContributionData>
  /** Map from YYYY-MM-DD date string to list of contributions on that day */
  byDate: Record<string, Array<ContributionEntry>>
}

export interface LoadingProgress {
  loaded: number
  total: number
  loadedTracks: number
  totalTracks: number
  currentPlaylist: string
}

/** Normalize an ISO date-time to a YYYY-MM-DD date key in local timezone. */
function toDateKey(isoString: string): string {
  // Parse the ISO string and use local date to match what the graph shows
  const d = new Date(isoString)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Map a contribution count to a level 0–4 for the heatmap color scale.
 * Buckets: 0 = none, 1 = 1-2, 2 = 3-5, 3 = 6-9, 4 = 10+
 */
function countToLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 9) return 3
  return 4
}

/** Fetch all items in a playlist by paginating until next is null. */
async function fetchAllPlaylistItems(playlistId: string) {
  const allItems = []
  let offset = 0
  const limit = 50
  let hasMore = true

  while (hasMore) {
    const page = await getPlaylistItems(playlistId, limit, offset)
    allItems.push(...page.items)
    hasMore = page.next !== null && allItems.length < page.total
    if (hasMore) offset += limit
  }

  return allItems
}

/**
 * Fetch all playlists for the given user by paginating until next is null.
 */
async function fetchAllPlaylistsForUser(userId: string) {
  const { queryClient } = getContext()
  const playlists = []
  let offset = 0
  const limit = 50
  let hasMore = true

  while (hasMore) {
    const page = await queryClient.fetchQuery(
      userPlaylistsQueryOptions(userId, limit, offset)
    )
    playlists.push(...page.items)
    hasMore = page.next !== null && playlists.length < page.total
    if (hasMore) offset += limit
  }

  return playlists
}

/**
 * Fetch all contributions (track adds to playlists) for a given Spotify user.
 * Pass the target user's Spotify ID to restrict to items added by this user only.
 * Optionally provide `onProgress` to receive incremental loading updates as each
 * playlist is scanned.
 */
export async function getContributionData(
  userId: string,
  onProgress?: (progress: LoadingProgress) => void
): Promise<ContributionResult> {
  if (!userId) {
    return { heatmapData: [], byDate: {} }
  }

  const allPlaylists = await fetchAllPlaylistsForUser(userId)
  // Only scan playlists the user owns (not ones they merely follow)
  const playlists = allPlaylists.filter((p) => p.owner.id === userId)

  let loadedTracks = 0
  const totalTracks = playlists.reduce((sum, p) => sum + p.tracks.total, 0)

  const byDate: Record<string, Array<ContributionEntry>> = {}
  let loaded = 0
  const total = playlists.length
  const inFlight = new Set<string>()

  await Promise.allSettled(
    playlists.map(async (playlist) => {
      inFlight.add(playlist.name)
      onProgress?.({
        loaded,
        total,
        loadedTracks,
        totalTracks,
        currentPlaylist: playlist.name,
      })

      let items
      try {
        items = await fetchAllPlaylistItems(playlist.id)
      } catch {
        // Skip playlists we can't read (e.g. 403 on private ones)
        loaded++
        loadedTracks += playlist.tracks.total
        inFlight.delete(playlist.name)
        onProgress?.({
          loaded,
          total,
          loadedTracks,
          totalTracks,
          currentPlaylist: inFlight.values().next().value ?? "",
        })
        return
      }

      for (const item of items) {
        if (!item.added_at) continue
        if (!item.track) continue
        if (item.added_by?.id !== userId) continue

        const track = item.track as {
          id: string
          name: string
          type?: string
          artists?: Array<{ name: string }>
          album?: { name: string; images?: Array<{ url: string }> }
          external_urls: { spotify: string }
        }

        const dateKey = toDateKey(item.added_at)
        const entry: ContributionEntry = {
          addedAt: item.added_at,
          trackId: track.id,
          trackName: track.name,
          trackUrl: track.external_urls.spotify,
          artistNames: track.artists?.map((a) => a.name).join(", ") ?? "",
          albumName: track.album?.name ?? "",
          albumImageUrl: track.album?.images?.[0]?.url ?? null,
          playlistId: playlist.id,
          playlistName: playlist.name,
          playlistUrl: playlist.external_urls.spotify,
        }

        ;(byDate[dateKey] ??= []).push(entry)
      }

      loaded++
      loadedTracks += items.length
      inFlight.delete(playlist.name)
      onProgress?.({
        loaded,
        total,
        loadedTracks,
        totalTracks,
        currentPlaylist: inFlight.values().next().value ?? "",
      })
    })
  )

  // Build heatmap array – only include days that have contributions
  const heatmapData: Array<ContributionData> = Object.entries(byDate).map(
    ([date, entries]) => ({
      date,
      count: entries.length,
      level: countToLevel(entries.length),
    })
  )

  return { heatmapData, byDate }
}
