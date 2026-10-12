// Single number card: label, value and optional hint (e.g. trend).
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <Card className={cn("gap-1 py-4", className)}>
      <CardContent className="px-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
