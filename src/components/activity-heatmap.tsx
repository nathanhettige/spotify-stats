import { useCallback, useMemo } from "react"
import type {
  ContributionEntry,
  LoadingProgress,
} from "@/lib/spotify/services/contribution-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface ActivityData {
  [date: string]: Array<ContributionEntry> | undefined
}

/** "rolling" = last 365 days; number = calendar year */
export type HeatmapView = "rolling" | number

interface ActivityHeatmapProps {
  activityData: ActivityData
  view: HeatmapView
  onViewChange: (view: HeatmapView) => void
  onDayClick?: (date: string, additions: Array<ContributionEntry>) => void
  selectedDate?: string | null
  isLoading?: boolean
  loadingProgress?: LoadingProgress | null
  /** Optional content rendered inside the card, below the legend. */
  detailPanel?: React.ReactNode
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Returns the date range for the given view. */
function getDateRange(view: HeatmapView): { startDate: Date; endDate: Date } {
  if (view === "rolling") {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 364)
    return { startDate: start, endDate: end }
  }
  return {
    startDate: new Date(view, 0, 1),
    endDate: new Date(view, 11, 31),
  }
}

/**
 * Build a list of week arrays for the given date range.
 * Each entry is Date | null — null means the cell is out of range.
 */
function getWeeksForRange(
  startDate: Date,
  endDate: Date
): Array<Array<Date | null>> {
  // Go back to the Sunday at or before startDate
  const gridStart = new Date(startDate)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())

  const weeks: Array<Array<Date | null>> = []
  const cursor = new Date(gridStart)

  while (cursor <= endDate) {
    const week: Array<Date | null> = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(cursor)
      day.setDate(day.getDate() + d)
      week.push(day >= startDate && day <= endDate ? day : null)
    }
    weeks.push(week)
    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

function getActivityLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 6) return 3
  return 4
}

/** Format a Date as local YYYY-MM-DD (matches what contribution-service writes) */
function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const LEVEL_COLORS = [
  "bg-heatmap-0",
  "bg-heatmap-1",
  "bg-heatmap-2",
  "bg-heatmap-3",
  "bg-heatmap-4",
] as const

export function ActivityHeatmap({
  activityData,
  view,
  onViewChange,
  onDayClick,
  selectedDate,
  isLoading = false,
  loadingProgress,
  detailPanel,
}: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear()
  const todayStr = toLocalDateString(new Date())
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const { startDate, endDate } = useMemo(() => getDateRange(view), [view])
  const weeks = useMemo(
    () => getWeeksForRange(startDate, endDate),
    [startDate, endDate]
  )

  const totalContributions = useMemo(() => {
    const startStr = toLocalDateString(startDate)
    const endStr = toLocalDateString(endDate)
    return Object.entries(activityData).reduce((sum, [date, additions]) => {
      return date >= startStr && date <= endStr
        ? sum + (additions?.length ?? 0)
        : sum
    }, 0)
  }, [activityData, startDate, endDate])

  const handleDayClick = useCallback(
    (date: Date) => {
      if (!onDayClick) return
      const dateStr = toLocalDateString(date)
      const additions = activityData[dateStr] ?? []
      if (additions.length > 0) {
        onDayClick(dateStr, additions)
      }
    },
    [activityData, onDayClick]
  )

  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; weekIndex: number }> = []
    let lastKey = ""

    weeks.forEach((week, weekIndex) => {
      const firstDay = week.find((d) => d !== null)
      if (firstDay) {
        const mo = firstDay.getMonth()
        const yr = firstDay.getFullYear()
        const key = `${yr}-${mo}`
        if (key !== lastKey) {
          labels.push({ label: MONTHS[mo], weekIndex })
          lastKey = key
        }
      }
    })

    return labels
  }, [weeks, view])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    const pct =
      loadingProgress && loadingProgress.totalTracks > 0
        ? Math.round(
            (loadingProgress.loadedTracks / loadingProgress.totalTracks) * 100
          )
        : 0

    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card p-4">
        {loadingProgress ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="font-medium text-foreground">
                Scanning playlists…
              </span>
            </div>
            <Progress value={pct} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              <span className="tabular-nums">
                {loadingProgress.loadedTracks} / {loadingProgress.totalTracks}
              </span>{" "}
              tracks scanned
              {loadingProgress.currentPlaylist && (
                <>
                  {" "}
                  &mdash; currently:{" "}
                  <span className="italic">
                    {loadingProgress.currentPlaylist}
                  </span>
                </>
              )}
            </p>
            <Skeleton className="mt-2 h-[116px] w-full" />
          </div>
        ) : (
          <Skeleton className="h-[116px] w-full" />
        )}
      </div>
    )
  }

  // ── Loaded ─────────────────────────────────────────────────────────────────
  const headingText =
    view === "rolling"
      ? `${totalContributions.toLocaleString()} additions in the last year`
      : `${totalContributions.toLocaleString()} additions in ${view}`

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {headingText}
          </h2>
          <p className="text-sm text-muted-foreground">
            Tracks added to playlists
          </p>
        </div>

        {/* View selector */}
        <Select
          value={view === "rolling" ? "rolling" : String(view)}
          onValueChange={(val) =>
            onViewChange(val === "rolling" ? "rolling" : Number(val))
          }
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="rolling">Last year</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="w-full">
        <div className="mx-auto w-fit min-w-[700px] pb-2">
          <div className="flex">
            {/* Day label column */}
            <div className="flex w-8 shrink-0 flex-col justify-around pt-5">
              {[1, 3, 5].map((dayIndex) => (
                <span
                  key={dayIndex}
                  className="text-xs leading-[14px] text-muted-foreground"
                >
                  {DAYS[dayIndex]}
                </span>
              ))}
            </div>

            {/* Month labels + week grid */}
            <div className="flex flex-col">
              {/* Month labels (absolutely positioned) */}
              <div className="relative mb-1 h-4">
                {monthLabels.map(({ label, weekIndex }, i) => (
                  <span
                    key={`${label}-${i}`}
                    className="absolute text-xs text-muted-foreground"
                    style={{ left: `${weekIndex * 14}px` }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Week columns */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((date, dayIndex) => {
                      if (!date) {
                        return (
                          <div
                            key={dayIndex}
                            className="size-[11px] rounded-sm bg-transparent"
                          />
                        )
                      }

                      const dateStr = toLocalDateString(date)
                      const additions = activityData[dateStr] ?? []
                      const level = getActivityLevel(additions.length)
                      const isToday = dateStr === todayStr
                      const isSelected = dateStr === selectedDate

                      return (
                        <button
                          key={dayIndex}
                          onClick={() => handleDayClick(date)}
                          disabled={additions.length === 0}
                          className={cn(
                            "size-[11px] rounded-sm transition-all",
                            LEVEL_COLORS[level],
                            additions.length > 0
                              ? "cursor-pointer hover:ring-2 hover:ring-primary/50"
                              : "cursor-default",
                            isToday && "ring-1 ring-foreground/30",
                            isSelected && "ring-2 ring-primary"
                          )}
                          title={`${date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}: ${additions.length} addition${additions.length !== 1 ? "s" : ""}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-[3px]">
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <div
              key={level}
              className={cn("size-[11px] rounded-sm", LEVEL_COLORS[level])}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {detailPanel && (
        <div className="mt-4 border-border pt-4">{detailPanel}</div>
      )}
    </div>
  )
}
