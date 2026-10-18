"use client"

// Big-button numeric keypad for PIN, qty and amounts.
import { Delete } from "lucide-react"

import { cn } from "@/lib/utils"

export type NumpadKey =
  "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "back"

interface NumpadProps {
  onKey: (key: NumpadKey) => void
  allowDecimal?: boolean
  disabled?: boolean
  className?: string
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

export function Numpad({
  onKey,
  allowDecimal = false,
  disabled,
  className,
}: NumpadProps) {
  const keyClass =
    "flex h-14 items-center justify-center rounded-lg bg-secondary text-2xl font-medium active:bg-accent disabled:opacity-50"

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {DIGITS.map((d) => (
        <button
          key={d}
          type="button"
          className={keyClass}
          disabled={disabled}
          onClick={() => onKey(d)}
        >
          {d}
        </button>
      ))}
      {allowDecimal ? (
        <button
          type="button"
          className={keyClass}
          disabled={disabled}
          onClick={() => onKey(".")}
        >
          .
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        className={keyClass}
        disabled={disabled}
        onClick={() => onKey("0")}
      >
        0
      </button>
      <button
        type="button"
        className={keyClass}
        disabled={disabled}
        onClick={() => onKey("back")}
        aria-label="Delete"
      >
        <Delete className="size-6" />
      </button>
    </div>
  )
}

/** Applies a key press to a numeric string. */
export function applyNumpadKey(value: string, key: NumpadKey, max = 10) {
  if (key === "back") return value.slice(0, -1)
  if (key === "." && value.includes(".")) return value
  if (value.length >= max) return value
  if (key === "." && value === "") return "0."
  return value + key
}
