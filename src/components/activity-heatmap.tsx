import { useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ContributionEntry } from "@/lib/spotify/services/contribution-service"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface ActivityData {
  [date: string]: Array<ContributionEntry> | undefined
}

interface ActivityHeatmapProps {
  activityData: ActivityData
  year: number
  onYearChange: (year: number) => void
  onDayClick?: (date: string, additions: Array<ContributionEntry>) => void
  isLoading?: boolean
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

function getWeeksInYear(year: number): Array<Array<Date>> {
  const weeks: Array<Array<Date>> = []
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  const firstDay = new Date(startDate)
  firstDay.setDate(firstDay.getDate() - firstDay.getDay())

  let currentWeek: Array<Date> = []
  const current = new Date(firstDay)

  while (current <= endDate || currentWeek.length > 0) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }

    if (current <= endDate || currentWeek.length > 0) {
      currentWeek.push(new Date(current))
    }

    current.setDate(current.getDate() + 1)

    if (current > endDate && currentWeek.length === 7) {
      weeks.push(currentWeek)
      break
    }
  }

  if (currentWeek.length > 0 && currentWeek.length < 7) {
    weeks.push(currentWeek)
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
  year,
  onYearChange,
  onDayClick,
  isLoading = false,
}: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear()
  const minYear = currentYear - 5
  const todayStr = toLocalDateString(new Date())

  const weeks = useMemo(() => getWeeksInYear(year), [year])

  const totalContributions = useMemo(() => {
    return Object.values(activityData).reduce(
      (sum, additions) => sum + (additions?.length ?? 0),
      0
    )
  }, [activityData])

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
    const labels: Array<{ month: string; weekIndex: number }> = []
    let lastMonth = -1

    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find((d) => d.getFullYear() === year)
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.getMonth()
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex })
          lastMonth = month
        }
      }
    })

    return labels
  }, [weeks, year])

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-[116px] w-full" />
        <div className="mt-3 flex justify-end">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {totalContributions.toLocaleString()} additions in {year}
          </h2>
          <p className="text-sm text-muted-foreground">
            Tracks added to playlists
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onYearChange(year - 1)}
            disabled={year <= minYear}
            className="size-8"
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-[4rem] text-center font-medium">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onYearChange(year + 1)}
            disabled={year >= currentYear}
            className="size-8"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="min-w-[700px] pb-2">
          <div className="flex">
            {/* Day label column – fixed width to align with month label offset */}
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

            {/* Month labels + week grid in the same column so widths align */}
            <div className="flex flex-col">
              {/* Absolutely positioned month labels */}
              <div className="relative mb-1 h-4">
                {monthLabels.map(({ month, weekIndex }, i) => (
                  <span
                    key={`${month}-${i}`}
                    className="absolute text-xs text-muted-foreground"
                    style={{ left: `${weekIndex * 14}px` }}
                  >
                    {month}
                  </span>
                ))}
              </div>

              {/* Week columns */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const date = week[dayIndex] as Date | undefined
                      if (!date || date.getFullYear() !== year) {
                        return (
                          <div
                            key={dayIndex}
                            className="size-[11px] rounded-sm bg-transparent"
                          />
                        )
                      }

                      const dateStr = toLocalDateString(date)
                      const additions = activityData[dateStr] || []
                      const level = getActivityLevel(additions.length)
                      const isToday = dateStr === todayStr

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
                            isToday && "ring-1 ring-foreground/30"
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
              {/* end: week columns */}
            </div>
            {/* end: month labels + grid column */}
          </div>
          {/* end: day labels + grid row */}
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
    </div>
  )
}
