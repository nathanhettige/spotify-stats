import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { ContributionEntry } from "@/lib/spotify/services/contribution-service"
import { contributionDataQueryOptions } from "@/lib/spotify/services/contribution-service"
import { Button } from "@/components/ui/button"
import { RequireAuth } from "@/lib/spotify/auth/require-auth"
import { useAuth } from "@/lib/spotify/auth/auth-context"
import ContributionGraph from "@/components/ui/contribution-graph"

export const Route = createFileRoute("/old_indx")({
  component: IndexPage,
})

function IndexPage() {
  return (
    <RequireAuth>
      <App />
    </RequireAuth>
  )
}

/** Past 365 days: start and end as YYYY-MM-DD (inclusive). */
function getPast365DaysRange(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 364)
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  }
}

function App() {
  const { user, logout } = useAuth()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  /** 'rolling' = past 365 days (default); number = calendar year */
  const [view, setView] = useState<"rolling" | number>("rolling")
  const [targetUserInput, setTargetUserInput] = useState<string>("")
  const [targetUserId, setTargetUserId] = useState<string>("")

  // Default to the signed-in user's ID when available
  useEffect(() => {
    if (user?.id && !targetUserId) {
      setTargetUserId(user.id)
      setTargetUserInput(user.id)
    }
  }, [user?.id, targetUserId])

  const normalizeUserInput = (value: string): string => {
    const trimmed = value.trim()
    if (!trimmed) return ""

    // Handle open.spotify.com user profile URLs
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed)
        const parts = url.pathname.split("/").filter(Boolean)
        const userIndex = parts.indexOf("user")
        if (userIndex !== -1 && parts[userIndex + 1]) {
          return parts[userIndex + 1]
        }
      }
    } catch {
      // fall through to other parsing
    }

    // Handle spotify:user:xyz URIs
    if (trimmed.startsWith("spotify:user:")) {
      return trimmed.replace("spotify:user:", "")
    }

    // Fallback: treat as raw user ID
    return trimmed
  }

  const userId = targetUserId || user?.id || ""
  const {
    data: contributionData,
    isLoading,
    isError,
    error,
  } = useQuery(contributionDataQueryOptions(userId))

  const heatmapData = contributionData?.heatmapData ?? []
  const byDate = contributionData?.byDate ?? {}
  const selectedContributions: Array<ContributionEntry> =
    selectedDate ? (byDate[selectedDate] ?? []) : []

  const formatSelectedDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const past365 = getPast365DaysRange()

  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <section className="w-full max-w-5xl">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div>
              <h1 className="text-lg font-semibold">Spotify Contributions</h1>
              <p className="text-sm text-muted-foreground">
                Songs added to playlists by a Spotify user
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Viewing user:</span>
              <input
                type="text"
                value={targetUserInput}
                onChange={(e) => setTargetUserInput(e.target.value)}
                placeholder={user?.id ? `e.g. ${user.id} or profile URL` : "Spotify user ID or profile URL"}
                className="h-7 min-w-[220px] rounded border border-input bg-background px-2 text-xs outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  const normalized = normalizeUserInput(targetUserInput)
                  setTargetUserId(normalized || (user?.id ?? ""))
                  setSelectedDate(null)
                }}
              >
                Apply
              </Button>
              {userId && (
                <span className="truncate">
                  ({userId})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setView("rolling")
                setSelectedDate(null)
              }}
              className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
                view === "rolling"
                  ? "bg-brand text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Last 365 days
            </button>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => {
                  setView(y)
                  setSelectedDate(null)
                }}
                className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
                  view === y
                    ? "bg-brand text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading contributions…
          </div>
        )}

        {isError && (
          <p className="py-2 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Failed to load contributions"}
          </p>
        )}

        {!isLoading && !isError && (
          <ContributionGraph
            data={heatmapData}
            {...(view === "rolling"
              ? { startDate: past365.startDate, endDate: past365.endDate }
              : { year: view })}
            selectedDate={selectedDate}
            onDaySelect={setSelectedDate}
          />
        )}
      </section>

      {selectedDate && (
        <section className="w-full max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              {selectedContributions.length === 0
                ? "No contributions on "
                : `${selectedContributions.length} contribution${selectedContributions.length === 1 ? "" : "s"} on `}
              <span className="text-muted-foreground font-normal">
                {formatSelectedDate(selectedDate)}
              </span>
            </h2>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>

          {selectedContributions.length > 0 && (
            <ul className="space-y-2">
              {selectedContributions.map((entry, idx) => (
                <ContributionEntryItem key={`${entry.trackId}-${idx}`} entry={entry} />
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="flex flex-col gap-4 text-sm leading-loose border-t border-border pt-6">
        <div>
          <p className="text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {user?.display_name ?? user?.email ?? user?.id ?? "Spotify user"}
            </span>
          </p>
          {user?.images[0]?.url && (
            <img
              src={user.images[0].url}
              alt=""
              className="mt-2 size-10 rounded-full"
            />
          )}
          <Button className="mt-3" variant="outline" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

function ContributionEntryItem({ entry }: { entry: ContributionEntry }) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
      {entry.albumImageUrl ? (
        <img
          src={entry.albumImageUrl}
          alt=""
          className="size-10 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground text-lg">
          ♪
        </div>
      )}
      <div className="min-w-0 flex-1">
        <a
          href={entry.trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
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
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        {entry.playlistName}
      </span>
    </li>
  )
}
