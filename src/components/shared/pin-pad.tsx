"use client"

// 4-digit PIN input: dots + numpad, auto-submits on the 4th digit.
import { useState } from "react"

import { cn } from "@/lib/utils"

import { applyNumpadKey, Numpad, type NumpadKey } from "./numpad"

const PIN_LENGTH = 4

interface PinPadProps {
  /** Resolve null on success, or an error message (clears the PIN). */
  onSubmit: (pin: string) => Promise<string | null>
}

export function PinPad({ onSubmit }: PinPadProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleKey(key: NumpadKey) {
    if (key === ".") return
    const next = applyNumpadKey(pin, key, PIN_LENGTH)
    setPin(next)
    setError(null)
    if (next.length < PIN_LENGTH) return

    setPending(true)
    const message = await onSubmit(next)
    setPending(false)
    if (message) {
      setPin("")
      setError(message)
    }
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-6">
      <div
        className={cn("flex gap-4", error && "animate-shake")}
        aria-label={`${pin.length} of ${PIN_LENGTH} digits entered`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-4 rounded-full border-2 border-primary",
              i < pin.length && "bg-primary",
              error && "border-destructive"
            )}
          />
        ))}
      </div>
      <p className="min-h-5 text-center text-sm text-destructive" role="alert">
        {error}
      </p>
      <Numpad onKey={handleKey} disabled={pending} className="w-full" />
    </div>
  )
}
