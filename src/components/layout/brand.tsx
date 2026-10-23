// App mark: navy bag icon (same as the PWA icon) with optional name.
import { ShoppingBag } from "lucide-react"

import { cn } from "@/lib/utils"

interface BrandProps {
  showName?: boolean
  size?: "sm" | "lg"
  className?: string
}

export function Brand({ showName = true, size = "sm", className }: BrandProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          size === "lg" ? "size-12 rounded-xl" : "size-8"
        )}
        aria-hidden
      >
        <ShoppingBag className={size === "lg" ? "size-6" : "size-4"} />
      </span>
      {showName && (
        <span
          className={cn(
            "font-semibold tracking-tight",
            size === "lg" ? "text-2xl" : "text-base"
          )}
        >
          Shop Dashboard
        </span>
      )}
    </span>
  )
}
