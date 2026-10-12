// Shows a Taka amount. Negative values in red.
import { cn, formatTaka } from "@/lib/utils"

interface MoneyProps {
  amount: number
  className?: string
}

export function Money({ amount, className }: MoneyProps) {
  return (
    <span
      className={cn(
        "tabular-nums",
        amount < 0 && "text-destructive",
        className
      )}
    >
      {formatTaka(amount)}
    </span>
  )
}
