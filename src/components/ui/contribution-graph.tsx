import React, { useMemo, useState } from "react"
import { motion } from "motion/react"

export interface ContributionData {
  date: string
  count: number
  level: number
}

export interface ContributionGraphProps {
  data?: Array<ContributionData>
  /** When set with endDate, show a rolling window (e.g. past 365 days) instead of a calendar year */
  startDate?: string
  endDate?: string
  year?: number
  className?: string
  showLegend?: boolean
  showTooltips?: boolean
  selectedDate?: string | null
  onDaySelect?: (date: string | null) => void
}

/** Format a Date as local YYYY-MM-DD */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
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

// Contribution level colors (similar to GitHub's)
// Level 0 = no contributions (neutral), levels 1–4 = contributions (green)
const CONTRIBUTION_COLORS = [
  "bg-background", // Level 0 - No contributions
  "bg-primary/25", // Level 1
  "bg-primary/50", // Level 2
  "bg-primary/75", // Level 3
  "bg-primary", // Level 4 - Max
]

const CONTRIBUTION_LEVELS = [0, 1, 2, 3, 4]

export function ContributionGraph({
  data = [],
  startDate: rangeStartStr,
  endDate: rangeEndStr,
  year = new Date().getFullYear(),
  className = "",
  showLegend = true,
  showTooltips = true,
  selectedDate = null,
  onDaySelect,
}: ContributionGraphProps) {
  const [hoveredDay, setHoveredDay] = useState<ContributionData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const useRange = Boolean(rangeStartStr && rangeEndStr)

  // Generate all days: either rolling range (past 365) or calendar year
  const yearData = useMemo(() => {
    const days: Array<ContributionData> = []

    if (useRange && rangeStartStr && rangeEndStr) {
      // Rolling window: 53 weeks starting from Sunday of the week containing rangeStartStr
      const rangeStart = new Date(rangeStartStr + "T12:00:00")
      const firstSunday = new Date(rangeStart)
      firstSunday.setDate(rangeStart.getDate() - rangeStart.getDay())
      firstSunday.setHours(0, 0, 0, 0)

      for (let week = 0; week < 53; week++) {
        for (let day = 0; day < 7; day++) {
          const currentDate = new Date(firstSunday)
          currentDate.setDate(firstSunday.getDate() + week * 7 + day)
          const dateString = toLocalDateString(currentDate)
          const isInRange =
            dateString >= rangeStartStr && dateString <= rangeEndStr

          if (isInRange) {
            const existingData = data.find((d) => d.date === dateString)
            days.push({
              date: dateString,
              count: existingData?.count || 0,
              level: existingData?.level || 0,
            })
          } else {
            days.push({ date: "", count: 0, level: 0 })
          }
        }
      }
      return days
    }

    // Calendar year
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    const firstSunday = new Date(startDate)
    firstSunday.setDate(startDate.getDate() - startDate.getDay())

    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(firstSunday)
        currentDate.setDate(firstSunday.getDate() + week * 7 + day)

        const isInRange = currentDate >= startDate && currentDate <= endDate
        const isPreviousYearDecember =
          currentDate.getFullYear() === year - 1 &&
          currentDate.getMonth() === 11
        const isNextYearJanuary =
          currentDate.getFullYear() === year + 1 && currentDate.getMonth() === 0

        if (isInRange || isPreviousYearDecember || isNextYearJanuary) {
          const dateString = toLocalDateString(currentDate)
          const existingData = data.find((d) => d.date === dateString)

          days.push({
            date: dateString,
            count: existingData?.count || 0,
            level: existingData?.level || 0,
          })
        } else {
          days.push({ date: "", count: 0, level: 0 })
        }
      }
    }

    return days
  }, [data, year, useRange, rangeStartStr, rangeEndStr])

  // Calculate month headers with colspan
  const monthHeaders = useMemo(() => {
    const headers: Array<{
      month: string
      colspan: number
      startWeek: number
    }> = []

    if (useRange && rangeStartStr) {
      const rangeStart = new Date(rangeStartStr + "T12:00:00")
      const firstSunday = new Date(rangeStart)
      firstSunday.setDate(rangeStart.getDate() - rangeStart.getDay())

      let currentMonth = -1
      let currentYear = -1
      let monthStartWeek = 0
      let weekCount = 0

      for (let week = 0; week < 53; week++) {
        const weekDate = new Date(firstSunday)
        weekDate.setDate(firstSunday.getDate() + week * 7)
        const monthKey = weekDate.getMonth()
        const yearKey = weekDate.getFullYear()

        if (monthKey !== currentMonth || yearKey !== currentYear) {
          if (currentMonth !== -1) {
            headers.push({
              month: MONTHS[currentMonth],
              colspan: weekCount,
              startWeek: monthStartWeek,
            })
          }
          currentMonth = monthKey
          currentYear = yearKey
          monthStartWeek = week
          weekCount = 1
        } else {
          weekCount++
        }
      }
      if (currentMonth !== -1) {
        headers.push({
          month: MONTHS[currentMonth],
          colspan: weekCount,
          startWeek: monthStartWeek,
        })
      }
      return headers
    }

    const startDate = new Date(year, 0, 1)
    const firstSunday = new Date(startDate)
    firstSunday.setDate(startDate.getDate() - startDate.getDay())

    let currentMonth = -1
    let currentYear = -1
    let monthStartWeek = 0
    let weekCount = 0

    for (let week = 0; week < 53; week++) {
      const weekDate = new Date(firstSunday)
      weekDate.setDate(firstSunday.getDate() + week * 7)

      const monthKey = weekDate.getMonth()
      const yearKey = weekDate.getFullYear()

      if (monthKey !== currentMonth || yearKey !== currentYear) {
        if (currentMonth !== -1) {
          const shouldShowMonth =
            currentYear === year ||
            (currentYear === year - 1 &&
              currentMonth === 11 &&
              startDate.getDay() !== 0 &&
              weekCount >= 2)

          if (shouldShowMonth) {
            headers.push({
              month: MONTHS[currentMonth],
              colspan: weekCount,
              startWeek: monthStartWeek,
            })
          }
        }
        currentMonth = monthKey
        currentYear = yearKey
        monthStartWeek = week
        weekCount = 1
      } else {
        weekCount++
      }
    }

    if (currentMonth !== -1) {
      const shouldShowMonth =
        currentYear === year ||
        (currentYear === year - 1 &&
          currentMonth === 11 &&
          startDate.getDay() !== 0 &&
          weekCount >= 2)

      if (shouldShowMonth) {
        headers.push({
          month: MONTHS[currentMonth],
          colspan: weekCount,
          startWeek: monthStartWeek,
        })
      }
    }

    return headers
  }, [year, useRange, rangeStartStr])

  const handleDayClick = (day: ContributionData) => {
    if (!onDaySelect || !day.date) return
    onDaySelect(day.date === selectedDate ? null : day.date)
  }

  const handleDayHover = (day: ContributionData, event: React.MouseEvent) => {
    if (showTooltips && day.date) {
      setHoveredDay(day)
      setTooltipPosition({ x: event.clientX, y: event.clientY })
    }
  }

  const handleDayLeave = () => {
    setHoveredDay(null)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getContributionText = (count: number) => {
    if (count === 0) return "No contributions"
    if (count === 1) return "1 contribution"
    return `${count} contributions`
  }

  return (
    <div className={`contribution-graph ${className}`}>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1 text-xs">
          <caption className="sr-only">
            {useRange
              ? `Contribution graph: past 365 days through ${rangeEndStr ?? ""}`
              : `Contribution graph for ${year}`}
          </caption>

          {/* Month Headers */}
          <thead>
            <tr className="h-3">
              <td className="w-7 min-w-7"></td>
              {monthHeaders.map((header, index) => (
                <td
                  key={index}
                  className="relative text-left text-foreground"
                  colSpan={header.colspan}
                >
                  <span className="absolute top-0 left-1">{header.month}</span>
                </td>
              ))}
            </tr>
          </thead>

          {/* Day Grid */}
          <tbody>
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <tr key={dayIndex} className="h-2.5">
                {/* Day Labels */}
                <td className="relative w-7 min-w-7 text-foreground">
                  {dayIndex % 2 === 0 && (
                    <span className="absolute -bottom-0.5 left-0 text-xs">
                      {DAYS[dayIndex]}
                    </span>
                  )}
                </td>

                {/* Day Cells */}
                {Array.from({ length: 53 }, (_w, weekIndex) => {
                  const dayData = yearData[weekIndex * 7 + dayIndex]
                  if (!dayData.date) {
                    return (
                      <td key={weekIndex} className="h-2.5 w-2.5 p-0">
                        <div className="h-2.5 w-2.5"></div>
                      </td>
                    )
                  }

                  const isSelected = dayData.date === selectedDate
                  return (
                    <td
                      key={weekIndex}
                      className="h-2.5 w-2.5 cursor-pointer p-0"
                      onMouseEnter={(e) => handleDayHover(dayData, e)}
                      onMouseLeave={handleDayLeave}
                      onClick={() => handleDayClick(dayData)}
                      title={
                        showTooltips
                          ? `${formatDate(dayData.date)}: ${getContributionText(dayData.count)}`
                          : undefined
                      }
                    >
                      <div
                        className={`h-2.5 w-2.5 rounded-sm ${
                          CONTRIBUTION_COLORS[dayData.level]
                        } hover:ring-2 hover:ring-background ${
                          isSelected ? "ring-2 ring-foreground" : ""
                        }`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {showTooltips && hoveredDay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="pointer-events-none fixed z-50 rounded-lg border bg-primary px-3 py-2 text-sm text-foreground shadow-lg"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 40,
          }}
        >
          <div className="font-semibold">
            {getContributionText(hoveredDay.count)}
          </div>
          <div className="text-foreground/70">
            {formatDate(hoveredDay.date)}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex items-center justify-between text-xs text-foreground/70">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {CONTRIBUTION_LEVELS.map((level) => (
              <div
                key={level}
                className={`h-3 w-3 rounded-sm ${CONTRIBUTION_COLORS[level]}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      )}
    </div>
  )
}

export default ContributionGraph
