// Single number card: label, value and optional hint (e.g. trend).
// tone="primary" = navy hero card for the most important number.
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: "default" | "primary"
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: StatCardProps) {
  const primary = tone === "primary"
  return (
    <Card
      className={cn(
        "gap-1 py-4 shadow-xs",
        primary &&
          "border-primary bg-primary text-primary-foreground shadow-md",
        className
      )}
    >
      <CardContent className="px-4">
        <p
          className={cn(
            "text-sm",
            primary ? "text-primary-foreground/75" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "font-semibold tracking-tight tabular-nums",
            primary ? "text-3xl" : "text-2xl"
          )}
        >
          {value}
        </p>
        {hint && (
          <div
            className={cn(
              "mt-0.5 text-[0.8125rem]",
              primary ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {hint}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
