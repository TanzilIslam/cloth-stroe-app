// Best selling hour and day (last 30 days) as simple bar charts.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, formatTaka } from "@/lib/utils"
import type { NamedValue, PeakTimes as PeakTimesData } from "@/types"

export function PeakTimes({ data }: { data: PeakTimesData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak times · 30 days</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <BarChart title="By hour" rows={data.hours} />
        <BarChart title="By day" rows={data.days} />
      </CardContent>
    </Card>
  )
}

/** Single-series vertical bars. Best bar is darker and named in the title. */
function BarChart({ title, rows }: { title: string; rows: NamedValue[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  const best = rows.find((r) => r.value === max && r.value > 0)

  return (
    <figure>
      <figcaption className="mb-7 flex justify-between text-sm">
        <span className="font-medium">{title}</span>
        {best && (
          <span className="text-muted-foreground">Best: {best.label}</span>
        )}
      </figcaption>
      <div className="flex h-28 items-end gap-[2px]" aria-hidden>
        {rows.map((r) => (
          <div
            key={r.label}
            className="group flex h-full flex-1 items-end"
            title={`${r.label}: ${formatTaka(r.value)}`}
          >
            <div
              className={cn(
                "relative w-full rounded-t-[4px]",
                r === best ? "bg-primary" : "bg-chart-1 group-hover:bg-chart-2"
              )}
              style={{ height: `${Math.max(2, (r.value / max) * 100)}%` }}
            >
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded border bg-popover px-1.5 py-0.5 text-xs whitespace-nowrap text-popover-foreground shadow-sm group-hover:block">
                {r.label}: {formatTaka(r.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-1 flex gap-[2px] text-[10px] text-muted-foreground"
        aria-hidden
      >
        {rows.map((r) => (
          <span key={r.label} className="flex-1 text-center">
            {r.label}
          </span>
        ))}
      </div>
      {/* Table view for screen readers */}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>{formatTaka(r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
