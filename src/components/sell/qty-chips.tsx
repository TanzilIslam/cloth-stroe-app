"use client"

// Quick qty buttons (1 / 2 / 2.5 / 3 yard) plus a custom-qty numpad.
import { useState } from "react"

import { applyNumpadKey, Numpad } from "@/components/shared/numpad"
import { Button } from "@/components/ui/button"
import type { Unit } from "@/types"

const CHIPS: Record<Unit, number[]> = {
  yard: [1, 2, 2.5, 3],
  meter: [1, 2, 2.5, 3],
  piece: [1, 2, 3, 5],
}

interface QtyChipsProps {
  unit: Unit
  /** Highest qty allowed (stock left). Undefined = no limit. */
  max?: number
  onPick: (qty: number) => void
}

export function QtyChips({ unit, max, onPick }: QtyChipsProps) {
  const [custom, setCustom] = useState<string | null>(null)
  const decimal = unit !== "piece"
  const value = Number(custom || 0)
  const tooMuch = max !== undefined && value > max

  if (custom !== null) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-center text-3xl font-semibold tabular-nums">
          {custom || "0"} <span className="text-base">{unit}</span>
        </p>
        {tooMuch && (
          <p className="text-center text-sm text-destructive">
            Only {max} {unit} in stock
          </p>
        )}
        <Numpad
          allowDecimal={decimal}
          onKey={(k) => setCustom(applyNumpadKey(custom, k, 6))}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setCustom(null)}>
            Back
          </Button>
          <Button
            disabled={value <= 0 || tooMuch}
            onClick={() => onPick(value)}
          >
            Add
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {CHIPS[unit].map((q) => (
        <Button
          key={q}
          variant="secondary"

          disabled={max !== undefined && q > max}
          onClick={() => onPick(q)}
        >
          {q}
        </Button>
      ))}
      <Button
        variant="outline"
        className="col-span-2"
        onClick={() => setCustom("")}
      >
        Custom
      </Button>
    </div>
  )
}
