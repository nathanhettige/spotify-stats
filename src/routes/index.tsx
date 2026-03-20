import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, ListMusic, Mic2, Music, X } from "lucide-react"
import type { ContributionEntry } from "@/lib/spotify/services/contribution-service"
import type { HeatmapView } from "@/components/activity-heatmap"
import { RequireAuth } from "@/lib/spotify/auth/require-auth"
import Footer from "@/components/footer"
import { ProfileHeader } from "@/components/profile-header"
import meQueryOptions from "@/lib/spotify/api/me/me"
import { userQueryOptions } from "@/lib/spotify/api/users/user"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserSearch } from "@/components/user-search"
import { PlaylistsTab } from "@/components/playlists-tab"
import { TopArtistsTab } from "@/components/top-artists-tab"
import { TopTracksTab } from "@/components/top-tracks-tab"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { useContributionData } from "@/lib/spotify/hooks/use-contribution-data"

export const Route = createFileRoute("/")({
  component: IndexPage,
})

function IndexPage() {
  return (
    <RequireAuth>
      <App />
    </RequireAuth>
  )
}

const MAX_VISIBLE = 4

function App() {
  const { data: me } = useQuery(meQueryOptions)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [heatmapView, setHeatmapView] = useState<HeatmapView>("rolling")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(
    new Set()
  )

  const {
    data: searchedUser,
    isLoading,
    isFetching,
  } = useQuery({
    ...userQueryOptions(selectedUserId!),
    enabled: !!selectedUserId,
  })

  const user = selectedUserId ? searchedUser : me
  const isLoadingProfile = selectedUserId ? isLoading : false

  const contributionUserId = user?.id ?? ""
  const {
    data: contributionData,
    isLoading: isLoadingContributions,
    progress: loadingProgress,
  } = useContributionData(contributionUserId)

  const byDate = contributionData?.byDate ?? {}
  const recentDays = useMemo(
    () => Object.keys(byDate).sort().reverse().slice(0, 3),
    [byDate]
  )
  const selectedContributions: Array<ContributionEntry> = selectedDate
    ? (byDate[selectedDate] ?? [])
    : []

  // Group selected day's contributions by playlist (preserving insertion order)
  const contributionsByPlaylist = selectedContributions.reduce<
    Record<string, Array<ContributionEntry>>
  >((acc, entry) => {
    ;(acc[entry.playlistName] ??= []).push(entry)
    return acc
  }, {})

  function selectDate(date: string | null) {
    setSelectedDate(date)
    setExpandedPlaylists(new Set())
  }

  function togglePlaylist(name: string) {
    setExpandedPlaylists((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className="grid min-h-svh grid-rows-[1fr_auto] gap-4">
      <main className="min-w-0 space-y-10 p-4">
        <UserSearch
          onSearch={(userId) => {
            setSelectedUserId(userId)
            setHeatmapView("rolling")
            selectDate(null)
          }}
          isSearching={isFetching}
        />

        {isLoadingProfile && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading profile...
          </div>
        )}

        {!isLoadingProfile && !user && (
          <div className="py-12 text-center text-muted-foreground">
            {selectedUserId
              ? "User not found or profile is private."
              : "Loading your profile..."}
          </div>
        )}

        {user && (
          <>
            <ProfileHeader
              followers={user.followers.total}
              name={user.display_name ?? ""}
              imageUrl={user.images[0]?.url ?? ""}
              profileUrl={user.external_urls.spotify}
            />

            <ActivityHeatmap
              activityData={byDate}
              view={heatmapView}
              onViewChange={(v) => {
                setHeatmapView(v)
                selectDate(null)
              }}
              onDayClick={(date) => selectDate(date)}
              selectedDate={selectedDate}
              isLoading={isLoadingContributions}
              loadingProgress={loadingProgress}
              detailPanel={
                selectedDate ? (
                  <DayDetail
                    selectedDate={selectedDate}
                    selectedContributions={selectedContributions}
                    contributionsByPlaylist={contributionsByPlaylist}
                    expandedPlaylists={expandedPlaylists}
                    onTogglePlaylist={togglePlaylist}
                    onDismiss={() => selectDate(null)}
                  />
                ) : recentDays.length > 0 && !isLoadingContributions ? (
                  <RecentDaysDetail
                    days={recentDays}
                    byDate={byDate}
                    onSelectDate={selectDate}
                  />
                ) : undefined
              }
            />

            <Tabs defaultValue="playlists">
              <TabsList className="w-full">
                <TabsTrigger value="playlists">
                  <ListMusic />
                  Playlists
                </TabsTrigger>
                {!selectedUserId && (
                  <TabsTrigger value="top-artists">
                    <Mic2 />
                    Top Artists
                  </TabsTrigger>
                )}
                {!selectedUserId && (
                  <TabsTrigger value="top-tracks">
                    <Music />
                    Top Tracks
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="playlists">
                <PlaylistsTab userId={user.id} />
              </TabsContent>

              {!selectedUserId && (
                <TabsContent value="top-artists">
                  <TopArtistsTab />
                </TabsContent>
              )}

              {!selectedUserId && (
                <TabsContent value="top-tracks">
                  <TopTracksTab />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface DayDetailProps {
  selectedDate: string
  selectedContributions: Array<ContributionEntry>
  contributionsByPlaylist: Record<string, Array<ContributionEntry>>
  expandedPlaylists: Set<string>
  onTogglePlaylist: (name: string) => void
  onDismiss: () => void
}

function DayDetail({
  selectedDate,
  selectedContributions,
  contributionsByPlaylist,
  expandedPlaylists,
  onTogglePlaylist,
  onDismiss,
}: DayDetailProps) {
  return (
    <div>
      {/* Date heading + rule */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="shrink-0 text-sm font-bold">
          <DateHeading dateStr={selectedDate} />
        </h2>
        <div className="h-px flex-1 bg-border" />
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {selectedContributions.length === 0 ? (
        <p className="pl-9 text-sm text-muted-foreground">
          No additions on this day.
        </p>
      ) : (
        <div className="relative pl-9">
          {/* Vertical timeline line */}
          <div className="absolute top-0 bottom-2 left-[11px] w-px bg-border" />
          <div className="space-y-6">
            {Object.entries(contributionsByPlaylist).map(
              ([playlistName, entries]) => (
                <PlaylistGroup
                  key={playlistName}
                  playlistName={playlistName}
                  playlistUrl={entries[0].playlistUrl}
                  entries={entries}
                  expanded={expandedPlaylists.has(playlistName)}
                  onToggle={() => onTogglePlaylist(playlistName)}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface RecentDaysDetailProps {
  days: string[]
  byDate: Record<string, Array<ContributionEntry>>
  onSelectDate: (date: string) => void
}

function RecentDaysDetail({
  days,
  byDate,
  onSelectDate,
}: RecentDaysDetailProps) {
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(
    new Set()
  )

  function togglePlaylist(key: string) {
    setExpandedPlaylists((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div>
      <p className="mb-5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Recent activity
      </p>
      <div className="space-y-8">
        {days.map((dateStr) => {
          const entries = byDate[dateStr] ?? []
          const contributionsByPlaylist = entries.reduce<
            Record<string, Array<ContributionEntry>>
          >((acc, entry) => {
            ;(acc[entry.playlistName] ??= []).push(entry)
            return acc
          }, {})

          return (
            <div key={dateStr}>
              {/* Date heading */}
              <div className="mb-5 flex items-center gap-3">
                <button
                  onClick={() => onSelectDate(dateStr)}
                  className="shrink-0 text-sm font-bold underline-offset-2 hover:underline"
                >
                  <DateHeading dateStr={dateStr} />
                </button>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="relative pl-9">
                {/* Vertical timeline line */}
                <div className="absolute top-0 bottom-2 left-[11px] w-px bg-border" />
                <div className="space-y-6">
                  {Object.entries(contributionsByPlaylist).map(
                    ([playlistName, dayEntries]) => {
                      const key = `${dateStr}:${playlistName}`
                      return (
                        <PlaylistGroup
                          key={key}
                          playlistName={playlistName}
                          entries={dayEntries}
                          expanded={expandedPlaylists.has(key)}
                          onToggle={() => togglePlaylist(key)}
                        />
                      )
                    }
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DateHeading({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr + "T00:00:00")
  const monthDay = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })
  return (
    <>
      {monthDay},{" "}
      <span className="font-normal text-muted-foreground">
        {d.getFullYear()}
      </span>
    </>
  )
}

interface PlaylistGroupProps {
  playlistName: string
  playlistUrl: string
  entries: Array<ContributionEntry>
  expanded: boolean
  onToggle: () => void
}

function PlaylistGroup({
  playlistName,
  playlistUrl,
  entries,
  expanded,
  onToggle,
}: PlaylistGroupProps) {
  const visibleEntries = expanded ? entries : entries.slice(0, MAX_VISIBLE)
  const hiddenCount = entries.length - MAX_VISIBLE
  const hasMore = hiddenCount > 0

  return (
    <div className="relative">
      {/* Timeline icon */}
      <div className="absolute -left-9 flex size-[22px] items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
        <Music className="size-3" />
      </div>

      {/* Content */}
      <div>
        <p className="mb-2 text-sm leading-snug font-semibold">
          Added {entries.length} {entries.length === 1 ? "track" : "tracks"} to{" "}
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {playlistName}
          </a>
        </p>

        <div className="overflow-hidden rounded-md border border-border">
          {visibleEntries.map((entry, idx) => (
            <TrackRow key={`${entry.trackId}-${idx}`} entry={entry} />
          ))}

          {hasMore && (
            <button
              onClick={onToggle}
              className="flex w-full items-center gap-1.5 border-t border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-3 shrink-0" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="size-3 shrink-0" />
                  Show {hiddenCount} more{" "}
                  {hiddenCount === 1 ? "track" : "tracks"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TrackRow({ entry }: { entry: ContributionEntry }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-0 hover:bg-muted/40">
      {entry.albumImageUrl ? (
        <img
          src={entry.albumImageUrl}
          alt=""
          className="size-8 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
          <Music className="size-3.5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <a
          href={entry.trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
        >
          {entry.trackName}
        </a>
        {entry.artistNames && (
          <p className="truncate text-xs text-muted-foreground">
            {entry.artistNames}
            {entry.albumName ? ` · ${entry.albumName}` : ""}
          </p>
        )}
      </div>
    </div>
  )
}
