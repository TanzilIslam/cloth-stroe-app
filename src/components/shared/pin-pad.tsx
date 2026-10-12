"use client"

// 4-digit PIN input: dots + numpad, auto-submits on the 4th digit.
import { useState } from "react"

import { cn } from "@/lib/utils"

import { applyNumpadKey, Numpad, type NumpadKey } from "./numpad"

const PIN_LENGTH = 4

interface PinPadProps {
  /** Resolve true on success; false clears the PIN and shows an error. */
  onSubmit: (pin: string) => Promise<boolean>
}

export function PinPad({ onSubmit }: PinPadProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleKey(key: NumpadKey) {
    if (key === ".") return
    const next = applyNumpadKey(pin, key, PIN_LENGTH)
    setPin(next)
    setError(false)
    if (next.length < PIN_LENGTH) return

    setPending(true)
    const ok = await onSubmit(next)
    setPending(false)
    if (!ok) {
      setPin("")
      setError(true)
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
      <p className="h-5 text-sm text-destructive" role="alert">
        {error && "Wrong PIN, try again"}
      </p>
      <Numpad onKey={handleKey} disabled={pending} className="w-full" />
    </div>
  )
}
