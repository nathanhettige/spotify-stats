import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Music2 } from "lucide-react"
import type { TimeRange } from "@/lib/spotify/api/me/top-artists"
import { topArtistsQueryOptions } from "@/lib/spotify/api/me/top-artists"
import { Button } from "@/components/ui/button"
import { ShowAllButton } from "@/components/show-all-button"

const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: "short_term", label: "Last 4 weeks" },
  { value: "medium_term", label: "Last 6 months" },
  { value: "long_term", label: "All time" },
]

const INITIAL_COUNT = 9

export function TopArtistsTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>("short_term")
  const [expanded, setExpanded] = useState(false)
  const { data, isLoading, error } = useQuery(topArtistsQueryOptions(timeRange))

  function handleTimeRangeChange(range: TimeRange) {
    setTimeRange(range)
    setExpanded(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TIME_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={timeRange === range.value ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTimeRangeChange(range.value)}
            className={
              timeRange === range.value
                ? "bg-[#1DB954] text-black hover:bg-[#1DB954]/90"
                : ""
            }
          >
            {range.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading top artists...
        </div>
      )}

      {error && (
        <div className="py-8 text-center text-destructive">
          Failed to load top artists.
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No top artists found for this time range.
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-7">
            {(expanded ? data.items : data.items.slice(0, INITIAL_COUNT)).map(
              (artist, index) => {
                const imageUrl = artist.images[0]?.url
                return (
                  <a
                    key={artist.id}
                    href={artist.external_urls.spotify}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted/40"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-full">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={artist.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Music2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="w-full truncate text-center text-xs font-medium">
                      <span className="text-muted-foreground">
                        {index + 1}
                        <span className="text-[0.8em]">.</span>{" "}
                      </span>
                      {artist.name}
                    </p>
                  </a>
                )
              }
            )}
          </div>
          {data.items.length > INITIAL_COUNT && (
            <ShowAllButton
              expanded={expanded}
              remaining={data.items.length - INITIAL_COUNT}
              onToggle={() => setExpanded(!expanded)}
            />
          )}
        </div>
      )}
    </div>
  )
}
