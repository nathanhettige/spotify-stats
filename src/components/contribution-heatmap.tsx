"use client"

import { HeatmapRect } from "@visx/heatmap"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { genBins, getSeededRandom } from "@visx/mock-data"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WEEKS = 53
const DAYS_PER_WEEK = 7

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export type HeatmapDatum = {
  bin: number
  bins: Array<{ bin: number; count: number }>
}

/** Generate contribution data: 53 columns (weeks) × 7 rows (days) for GitHub-style grid.
 *  genBins(length, height) → length items, each with height bins; visx uses data = columns, bins = rows. */
function generateFakeContributionData(): Array<HeatmapDatum> {
  const seededRandom = getSeededRandom(0.441)
  return genBins(
    WEEKS,
    DAYS_PER_WEEK,
    (i) => i,
    (_i, _number) =>
      seededRandom() > 0.4 ? Math.floor(seededRandom() * 18) : 0,
  )
}

function max<T>(data: Array<T>, value: (d: T) => number): number {
  return Math.max(...data.map(value))
}

const bins = (d: HeatmapDatum) => d.bins
const count = (d: { bin: number; count: number }) => d.count

const defaultMargin = { top: 20, left: 36, right: 10, bottom: 24 }

export interface ContributionHeatmapProps {
  width: number
  height: number
  margin?: typeof defaultMargin
  data?: Array<HeatmapDatum>
}

const CONTRIBUTION_COLORS = [
  "var(--color-contribution-0, #ebedf0)",
  "var(--color-contribution-1, #9be9a8)",
  "var(--color-contribution-2, #40c463)",
  "var(--color-contribution-3, #30a14e)",
  "var(--color-contribution-4, #216e39)",
]

export function ContributionHeatmap({
  width,
  height,
  margin = defaultMargin,
  data = generateFakeContributionData(),
}: ContributionHeatmapProps) {
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const colorMax = max(data, (d) => max(bins(d), count))
  const bucketSizeMax = max(data, (d) => bins(d).length)

  const gap = 3
  const numCols = data.length
  const numRows = bucketSizeMax
  const minCellSize = 10
  const cellSize = Math.max(
    minCellSize,
    Math.min(
      (innerWidth - (numCols - 1) * gap) / numCols,
      (innerHeight - (numRows - 1) * gap) / numRows,
    ),
  )
  const binWidth = cellSize
  const binHeight = cellSize
  const heatmapWidth = numCols * cellSize + (numCols - 1) * gap
  const heatmapHeight = numRows * cellSize + (numRows - 1) * gap
  const svgWidth = Math.max(width, margin.left + heatmapWidth + margin.right)
  const svgHeight = Math.max(height, margin.top + heatmapHeight + margin.bottom)

  const xScale = scaleLinear<number>({
    domain: [0, numCols],
  })
  const yScale = scaleLinear<number>({
    domain: [0, numRows],
  })

  xScale.range([0, heatmapWidth])
  yScale.range([heatmapHeight, 0])

  const colorScale = scaleLinear<string>({
    domain: [0, colorMax * 0.25, colorMax * 0.5, colorMax * 0.75, colorMax],
    range: CONTRIBUTION_COLORS,
    clamp: true,
  })

  const opacityScale = scaleLinear<number>({
    domain: [0, colorMax],
    range: [0.4, 1],
    clamp: true,
  })

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-foreground">
        Contribution activity
      </h3>
      <svg width={svgWidth} height={svgHeight} className="max-w-full">
        <Group left={margin.left} top={margin.top}>
          {/* Day labels on the left (y-axis) */}
          {DAY_LABELS.map((label, i) => (
            <text
              key={label}
              x={-8}
              y={yScale(i) + gap + (cellSize - gap) / 2}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {label}
            </text>
          ))}
          {/* Month labels on top (one per ~4 weeks) */}
          {[0, 4, 9, 13, 17, 22, 26, 30, 35, 39, 43, 48].map((weekIndex) => (
            <text
              key={weekIndex}
              x={weekIndex * (cellSize + gap) + cellSize / 2}
              y={-6}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {MONTH_LABELS[weekIndex % 12]}
            </text>
          ))}
          <Group left={0}>
            <HeatmapRect<HeatmapDatum, { bin: number; count: number }>
              data={data}
              xScale={(d) => xScale(d)}
              yScale={(d) => yScale(d)}
              colorScale={colorScale}
              opacityScale={opacityScale}
              binWidth={binWidth}
              binHeight={binHeight}
              gap={gap}
            >
              {(cells) =>
                cells.map((heatmapBins) =>
                  heatmapBins.map((bin) => (
                    <rect
                      key={`heatmap-rect-${bin.row}-${bin.column}`}
                      width={bin.width}
                      height={bin.height}
                      x={bin.x}
                      y={bin.y}
                      fill={bin.color ?? ""}
                      fillOpacity={bin.opacity ?? 1}
                      rx={2}
                      ry={2}
                      className="rounded-sm"
                    >
                      <title>
                        {bin.count ?? 0} contribution{(bin.count ?? 0) !== 1 ? "s" : ""} on{" "}
                        {DAY_LABELS[bin.row]} (week {bin.column + 1})
                      </title>
                    </rect>
                  )),
                )
              }
            </HeatmapRect>
          </Group>
        </Group>
      </svg>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="rounded-sm"
            style={{
              width: 12,
              height: 12,
              backgroundColor: colorScale((colorMax * (i + 1)) / 5),
              opacity: opacityScale((colorMax * (i + 1)) / 5),
            }}
            aria-hidden
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
