import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Music2 } from "lucide-react"
import type { TimeRange } from "@/lib/spotify/api/me/top-artists"
import { topArtistsQueryOptions } from "@/lib/spotify/api/me/top-artists"
import { cn } from "@/lib/utils"

const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: "short_term", label: "Last 4 weeks" },
  { value: "medium_term", label: "Last 6 months" },
  { value: "long_term", label: "All time" },
]

export function TopArtistsTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term")
  const { data, isLoading, error } = useQuery(topArtistsQueryOptions(timeRange))

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TIME_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
              timeRange === range.value
                ? "bg-[#1DB954] text-black"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {range.label}
          </button>
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
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-7">
          {data.items.map((artist, index) => {
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
                  <span className="text-muted-foreground">{index + 1}<span className="text-[0.8em]">.</span> </span>{artist.name}
                </p>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
